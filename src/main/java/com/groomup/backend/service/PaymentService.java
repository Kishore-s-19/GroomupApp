package com.groomup.backend.service;

import com.groomup.backend.dto.PaymentRequest;
import com.groomup.backend.dto.PaymentResponse;
import com.groomup.backend.model.Order;
import com.groomup.backend.model.OrderItem;
import com.groomup.backend.model.Payment;
import com.groomup.backend.model.PaymentStatus;
import com.groomup.backend.model.Product;
import com.groomup.backend.model.User;
import com.groomup.backend.repository.OrderRepository;
import com.groomup.backend.repository.PaymentRepository;
import com.groomup.backend.repository.ProductRepository;
import com.groomup.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;
import static org.springframework.http.HttpStatus.CONFLICT;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final RazorpayGatewayService razorpayGatewayService;
    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    public PaymentService(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            RazorpayGatewayService razorpayGatewayService,
            OrderService orderService,
            ObjectMapper objectMapper
    ) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.razorpayGatewayService = razorpayGatewayService;
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        if (request.getOrderId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Order ID is required");
        }
        if (request.getProvider() == null || request.getProvider().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Provider is required");
        }
        if (!"RAZORPAY".equalsIgnoreCase(request.getProvider())) {
            throw new ResponseStatusException(BAD_REQUEST, "Unsupported provider");
        }

        User user = getCurrentUser();
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Access denied");
        }

        if (order.getTotalPrice() == null || order.getTotalPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid order amount");
        }

        if ("PAID".equals(order.getStatus())) {
            throw new ResponseStatusException(CONFLICT, "Order already paid");
        }

        Payment latest = paymentRepository
                .findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                .orElse(null);

        int attemptNumber =
                latest == null ? 1 :
                        (latest.getAttemptNumber() == null ? 1 : latest.getAttemptNumber() + 1);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider("RAZORPAY");
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setAmount(order.getTotalPrice());
        payment.setCurrency("INR");
        payment.setAttemptNumber(attemptNumber);
        payment.setExpiresAt(LocalDateTime.now().plusMinutes(2));

        String receipt = "order_" + order.getId() + "_attempt_" + attemptNumber;

        String gatewayOrderId = razorpayGatewayService.createOrder(
                payment.getAmount(),
                payment.getCurrency(),
                receipt
        );

        payment.setGatewayOrderId(gatewayOrderId);
        payment.setStatus(PaymentStatus.PENDING);

        Payment saved = paymentRepository.save(payment);

        log.info("Payment created: {} for order: {}", saved.getId(), order.getId());

        return new PaymentResponse(
                saved.getId(),
                order.getId(),
                saved.getProvider(),
                saved.getStatus().name(),
                saved.getAmount(),
                saved.getCurrency(),
                saved.getGatewayOrderId(),
                razorpayGatewayService.getKeyId()
        );
    }

    @Scheduled(fixedDelay = 15000)
    public void expirePendingPayments() {
        LocalDateTime now = LocalDateTime.now();
        List<Payment> expiredPending = paymentRepository.findByStatusAndExpiresAtBefore(PaymentStatus.PENDING, now);
        if (expiredPending.isEmpty()) {
            return;
        }

        log.info("Expiring {} pending payment(s) (now={})", expiredPending.size(), now);

        for (Payment payment : expiredPending) {
            try {
                processSinglePaymentExpiry(payment.getId());
            } catch (Exception e) {
                log.error("Failed to expire payment {}: {}", payment.getId(), e.getMessage());
            }
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void processSinglePaymentExpiry(Long paymentId) {
        Payment fresh = paymentRepository.findById(paymentId).orElse(null);
        if (fresh == null || fresh.getStatus() != PaymentStatus.PENDING) {
            return;
        }

        Order order = fresh.getOrder();
        if (order == null || order.getId() == null) {
            fresh.setStatus(PaymentStatus.EXPIRED);
            if (fresh.getFailureReason() == null || fresh.getFailureReason().isBlank()) {
                fresh.setFailureReason("Expired");
            }
            paymentRepository.save(fresh);
            return;
        }

        Payment latest = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
        if (latest == null || latest.getId() == null || !latest.getId().equals(fresh.getId())) {
            fresh.setStatus(PaymentStatus.EXPIRED);
            if (fresh.getFailureReason() == null || fresh.getFailureReason().isBlank()) {
                fresh.setFailureReason("Expired");
            }
            paymentRepository.save(fresh);
            return;
        }

        if (isTerminalOrder(order.getStatus())) {
            fresh.setStatus(PaymentStatus.EXPIRED);
            if (fresh.getFailureReason() == null || fresh.getFailureReason().isBlank()) {
                fresh.setFailureReason("Expired");
            }
            paymentRepository.save(fresh);
            return;
        }

        orderService.releaseReservedStock(order.getId());
        order.setStatus("CANCELLED");
        orderRepository.save(order);

        fresh.setStatus(PaymentStatus.EXPIRED);
        fresh.setFailureReason("Expired - no payment captured within 2 minutes");
        paymentRepository.save(fresh);

        log.info("Auto-cancelled orderId={} due to payment expiry (paymentId={})", order.getId(), fresh.getId());
    }

    @Transactional
    public void handleRazorpayWebhook(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.error("Webhook secret not configured");
            throw new ResponseStatusException(BAD_REQUEST, "Webhook not configured");
        }

        if (!verifySignature(payload, signature)) {
            log.warn("Invalid Razorpay webhook signature");
            throw new ResponseStatusException(BAD_REQUEST, "Invalid Razorpay signature");
        }

        JsonNode root = parseWebhookPayload(payload);
        String event = textOrNull(root.path("event"));
        if (event == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook payload: missing event");
        }

        log.info("Razorpay webhook event received: {}", event);

        switch (event) {
            case "payment.captured":
            case "order.paid":
                handlePaymentCaptured(root, event);
                return;
            case "payment.failed":
                handlePaymentFailed(root, event);
                return;
            default:
                log.info("Ignoring webhook event: {}", event);
        }
    }

    private void handlePaymentCaptured(JsonNode root, String event) {
        String gatewayOrderId = extractGatewayOrderId(root);
        if (gatewayOrderId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook payload: missing order_id");
        }

        String gatewayPaymentId = extractGatewayPaymentId(root);
        if (gatewayPaymentId != null) {
            Payment existingByPaymentId = paymentRepository.findByGatewayPaymentId(gatewayPaymentId).orElse(null);
            if (existingByPaymentId != null && existingByPaymentId.getStatus() == PaymentStatus.SUCCESS) {
                log.info("Duplicate webhook received for paymentId={}, ignoring", gatewayPaymentId);
                return;
            }
        }

        Payment payment = paymentRepository.findByGatewayOrderId(gatewayOrderId)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Payment not found for gatewayOrderId " + gatewayOrderId
                ));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Payment {} already successful, ignoring duplicate webhook", payment.getId());
            return;
        }

        if (isTerminalPaymentStatus(payment.getStatus())) {
            log.warn("Ignoring webhook for paymentId={} (status={})", payment.getId(), payment.getStatus());
            return;
        }

        if (gatewayPaymentId != null && (payment.getGatewayPaymentId() == null || payment.getGatewayPaymentId().isBlank())) {
            payment.setGatewayPaymentId(gatewayPaymentId);
        }
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        if (order != null) {
            if ("CANCELLED".equals(order.getStatus())) {
                log.warn("Payment received for cancelled order. Marking as requires review. orderId={}", order.getId());
                return;
            }

            orderService.confirmStockDeduction(order.getId());
            order.setStatus("PAID");
            orderRepository.save(order);

            log.info("Order {} marked as PAID, stock deducted (event={})", order.getId(), event);
        }
    }

    private void handlePaymentFailed(JsonNode root, String event) {
        String gatewayOrderId = extractGatewayOrderId(root);
        if (gatewayOrderId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook payload: missing order_id");
        }

        String gatewayPaymentId = extractGatewayPaymentId(root);
        String failureReason = extractFailureReason(root);

        if (gatewayPaymentId != null) {
            Payment existingByPaymentId = paymentRepository.findByGatewayPaymentId(gatewayPaymentId).orElse(null);
            if (existingByPaymentId != null && existingByPaymentId.getStatus() == PaymentStatus.SUCCESS) {
                log.warn("Ignoring failed webhook for already successful paymentId={}", gatewayPaymentId);
                return;
            }
        }

        Payment payment = paymentRepository.findByGatewayOrderId(gatewayOrderId)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Payment not found for gatewayOrderId " + gatewayOrderId
                ));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.warn("Ignoring failed webhook for successful paymentId={}", payment.getId());
            return;
        }

        if (payment.getStatus() == PaymentStatus.FAILED ||
                payment.getStatus() == PaymentStatus.CANCELLED ||
                payment.getStatus() == PaymentStatus.EXPIRED ||
                payment.getStatus() == PaymentStatus.REFUNDED) {
            log.info("Duplicate failed webhook for paymentId={} (status={})", payment.getId(), payment.getStatus());
            return;
        }

        if (gatewayPaymentId != null && (payment.getGatewayPaymentId() == null || payment.getGatewayPaymentId().isBlank())) {
            payment.setGatewayPaymentId(gatewayPaymentId);
        }
        payment.setStatus(PaymentStatus.FAILED);
        if (failureReason != null && (payment.getFailureReason() == null || payment.getFailureReason().isBlank())) {
            payment.setFailureReason(failureReason);
        }
        paymentRepository.save(payment);

        log.info("Payment {} marked as FAILED from webhook (event={})", payment.getId(), event);
    }

    private JsonNode parseWebhookPayload(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (Exception e) {
            log.warn("Invalid webhook payload");
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook payload");
        }
    }

    private boolean verifySignature(String payload, String actualSignature) {
        try {
            if (actualSignature == null || actualSignature.isBlank()) {
                return false;
            }

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(secretKey);

            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(hash);

            byte[] expectedBytes = expectedSignature.getBytes(StandardCharsets.UTF_8);
            byte[] actualBytes = actualSignature.trim().toLowerCase().getBytes(StandardCharsets.UTF_8);
            boolean valid = MessageDigest.isEqual(expectedBytes, actualBytes);
            if (!valid) {
                log.warn("Signature mismatch");
            }
            return valid;

        } catch (Exception e) {
            log.error("Signature verification failed", e);
            throw new RuntimeException("Signature verification failed", e);
        }
    }

    private static String extractGatewayOrderId(JsonNode root) {
        String orderId = textOrNull(root.path("payload").path("payment").path("entity").path("order_id"));
        if (orderId == null) {
            orderId = textOrNull(root.path("payload").path("order").path("entity").path("id"));
        }
        return orderId;
    }

    private static String extractGatewayPaymentId(JsonNode root) {
        return textOrNull(root.path("payload").path("payment").path("entity").path("id"));
    }

    private static String extractFailureReason(JsonNode root) {
        String reason = textOrNull(root.path("payload").path("payment").path("entity").path("error_description"));
        if (reason == null) {
            reason = textOrNull(root.path("payload").path("payment").path("entity").path("error_reason"));
        }
        if (reason == null) {
            reason = textOrNull(root.path("payload").path("payment").path("entity").path("error_code"));
        }
        return reason;
    }

    private static String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText();
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }

    private static boolean isTerminalPaymentStatus(PaymentStatus status) {
        if (status == null) {
            return false;
        }
        return status == PaymentStatus.SUCCESS ||
                status == PaymentStatus.FAILED ||
                status == PaymentStatus.CANCELLED ||
                status == PaymentStatus.EXPIRED ||
                status == PaymentStatus.REFUNDED;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "User is not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }

    @Transactional(readOnly = true)
    public Payment getLatestPaymentForOrder(Long orderId) {
        return paymentRepository
                .findTopByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "No payment found for order id " + orderId
                        )
                );
    }

    private boolean isTerminalOrder(String status) {
        if (status == null) {
            return false;
        }
        return "PAID".equals(status) || "DELIVERED".equals(status) || "CANCELLED".equals(status);
    }
}
