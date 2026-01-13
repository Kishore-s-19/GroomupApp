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
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final RazorpayGatewayService razorpayGatewayService;

    @Value("${razorpay.webhook-secret}")
    private String webhookSecret;

    public PaymentService(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            RazorpayGatewayService razorpayGatewayService
    ) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.razorpayGatewayService = razorpayGatewayService;
    }

    // =====================================================
    // CREATE PAYMENT (EXISTING CODE - UNCHANGED)
    // =====================================================
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
    @Transactional
    public void expirePendingPayments() {
        LocalDateTime now = LocalDateTime.now();
        List<Payment> expiredPending = paymentRepository.findByStatusAndExpiresAtBefore(PaymentStatus.PENDING, now);
        if (expiredPending.isEmpty()) {
            return;
        }

        log.info("Expiring {} pending payment(s) (now={})", expiredPending.size(), now);

        for (Payment payment : expiredPending) {
            if (payment == null || payment.getId() == null) {
                continue;
            }
            Payment fresh = paymentRepository.findById(payment.getId()).orElse(null);
            if (fresh == null || fresh.getStatus() != PaymentStatus.PENDING) {
                continue;
            }

            Order order = fresh.getOrder();
            if (order == null || order.getId() == null) {
                fresh.setStatus(PaymentStatus.EXPIRED);
                if (fresh.getFailureReason() == null || fresh.getFailureReason().isBlank()) {
                    fresh.setFailureReason("Expired");
                }
                paymentRepository.save(fresh);
                continue;
            }

            Payment latest = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
            if (latest == null || latest.getId() == null || !latest.getId().equals(fresh.getId())) {
                fresh.setStatus(PaymentStatus.EXPIRED);
                if (fresh.getFailureReason() == null || fresh.getFailureReason().isBlank()) {
                    fresh.setFailureReason("Expired");
                }
                paymentRepository.save(fresh);
                continue;
            }

            if (isTerminalOrder(order.getStatus())) {
                fresh.setStatus(PaymentStatus.EXPIRED);
                if (fresh.getFailureReason() == null || fresh.getFailureReason().isBlank()) {
                    fresh.setFailureReason("Expired");
                }
                paymentRepository.save(fresh);
                continue;
            }

            restoreStock(order);
            order.setStatus("CANCELLED");
            orderRepository.save(order);

            fresh.setStatus(PaymentStatus.EXPIRED);
            fresh.setFailureReason("Expired - no payment captured within 2 minutes");
            paymentRepository.save(fresh);

            log.info("Auto-cancelled orderId={} due to payment expiry (paymentId={})", order.getId(), fresh.getId());
        }
    }

    // =====================================================
    // RAZORPAY WEBHOOK HANDLER (NEW CODE)
    // =====================================================
    @Transactional
    public void handleRazorpayWebhook(String payload, String signature) {

        if (!verifySignature(payload, signature)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid Razorpay signature");
        }

        // For now we just log (next step DB update pannalaam)
        System.out.println("✅ Razorpay webhook verified successfully");
        System.out.println(payload);

        // TODO (next step):
        // 1. Parse JSON
        // 2. Extract order_id
        // 3. Find Payment by gatewayOrderId
        // 4. Mark PaymentStatus.SUCCESS
        // 5. Mark Order as PAID

        String event = extractJsonString(payload, "event");
        if (event == null || event.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook payload: missing event");
        }

        if (!"payment.captured".equals(event)) {
            return;
        }

        String gatewayOrderId = extractJsonString(payload, "order_id");
        if (gatewayOrderId == null || gatewayOrderId.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook payload: missing order_id");
        }

        String gatewayPaymentId = extractPaymentIdFromPayload(payload);
        if (gatewayPaymentId == null || gatewayPaymentId.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook payload: missing payment id");
        }

        Payment payment = paymentRepository.findByGatewayOrderId(gatewayOrderId)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Payment not found for gatewayOrderId " + gatewayOrderId
                ));

        if (payment.getStatus() == PaymentStatus.EXPIRED || payment.getStatus() == PaymentStatus.FAILED || payment.getStatus() == PaymentStatus.CANCELLED) {
            log.warn("Ignoring webhook for paymentId={} (status={})", payment.getId(), payment.getStatus());
            return;
        }

        payment.setGatewayPaymentId(gatewayPaymentId);
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        if (order != null) {
            if ("CANCELLED".equals(order.getStatus())) {
                log.warn("Ignoring webhook for cancelled orderId={} (paymentId={})", order.getId(), payment.getId());
                return;
            }
            order.setStatus("PAID");
            orderRepository.save(order);
        }
    }

    // =====================================================
    // SIGNATURE VERIFICATION
    // =====================================================
    private boolean verifySignature(String payload, String actualSignature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(secretKey);

            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(hash);

            return expectedSignature.equals(actualSignature);

        } catch (Exception e) {
            throw new RuntimeException("Signature verification failed", e);
        }
    }

    private static String extractJsonString(String json, String key) {
        if (json == null || json.isBlank() || key == null || key.isBlank()) {
            return null;
        }
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    private static String extractPaymentIdFromPayload(String payload) {
        if (payload == null || payload.isBlank()) {
            return null;
        }

        Pattern paymentEntityId = Pattern.compile(
                "\"payment\"\\s*:\\s*\\{[\\s\\S]*?\"entity\"\\s*:\\s*\\{[\\s\\S]*?\"id\"\\s*:\\s*\"([^\"]+)\"",
                Pattern.DOTALL
        );
        Matcher m = paymentEntityId.matcher(payload);
        if (m.find()) {
            return m.group(1);
        }

        return extractJsonString(payload, "id");
    }

    // =====================================================
    // AUTH HELPERS (EXISTING CODE - UNCHANGED)
    // =====================================================
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

    private void restoreStock(Order order) {
        List<OrderItem> items = order.getItems();
        if (items == null || items.isEmpty()) {
            return;
        }
        for (OrderItem item : items) {
            Product product = item.getProduct();
            if (product == null) {
                continue;
            }
            Integer restoreQty = item.getQuantity();
            if (restoreQty == null || restoreQty <= 0) {
                continue;
            }
            product.setStockQuantity(product.getStockQuantity() + restoreQty);
            productRepository.save(product);
        }
    }

}
