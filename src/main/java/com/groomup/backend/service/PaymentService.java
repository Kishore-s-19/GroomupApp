package com.groomup.backend.service;

import com.groomup.backend.dto.PaymentRequest;
import com.groomup.backend.dto.PaymentResponse;
import com.groomup.backend.model.Order;
import com.groomup.backend.model.Payment;
import com.groomup.backend.model.PaymentStatus;
import com.groomup.backend.model.User;
import com.groomup.backend.repository.OrderRepository;
import com.groomup.backend.repository.PaymentRepository;
import com.groomup.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RazorpayGatewayService razorpayGatewayService;

    public PaymentService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            RazorpayGatewayService razorpayGatewayService
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.razorpayGatewayService = razorpayGatewayService;
    }

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        User user = getCurrentUser();

        if (request.getOrderId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Order ID is required");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Access denied");
        }

        if (isTerminalOrder(order.getStatus())) {
            throw new ResponseStatusException(CONFLICT, "Order cannot accept payments");
        }

        BigDecimal amount = order.getTotalPrice();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid order amount");
        }

        String provider = normalizeProvider(request.getProvider());

        Payment latest = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
        if (latest != null && isActive(latest)) {
            return toPaymentResponse(latest);
        }

        Integer attemptNumber = nextAttemptNumber(order.getId());

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider(provider);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAmount(amount);
        payment.setCurrency("INR");
        payment.setAttemptNumber(attemptNumber);
        payment.setGatewayOrderId(createGatewayOrderId(provider, order.getId(), attemptNumber, amount));
        payment.setExpiresAt(LocalDateTime.now().plusMinutes(15));

        if ("FAILED".equals(order.getStatus())) {
            order.setStatus("PENDING");
            orderRepository.save(order);
        }

        Payment saved = paymentRepository.save(payment);

        return toPaymentResponse(saved);
    }

    @Transactional
    public PaymentResponse retryPayment(PaymentRequest request) {
        User user = getCurrentUser();

        if (request.getOrderId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Order ID is required");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Access denied");
        }

        if (isTerminalOrder(order.getStatus())) {
            throw new ResponseStatusException(CONFLICT, "Order cannot accept payments");
        }

        Payment latest = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
        if (latest != null && isActive(latest)) {
            return toPaymentResponse(latest);
        }
        if (latest != null && isExpired(latest) && latest.getStatus() == PaymentStatus.PENDING) {
            latest.setStatus(PaymentStatus.EXPIRED);
            paymentRepository.save(latest);
        }

        return createPayment(request);
    }

    private String createGatewayOrderId(String provider, Long orderId, Integer attemptNumber, BigDecimal amount) {
        if ("RAZORPAY".equals(provider)) {
            String receipt = "order_" + orderId + "_attempt_" + attemptNumber;
            return razorpayGatewayService.createOrder(amount, "INR", receipt);
        }
        return "mock_" + UUID.randomUUID();
    }

    private String gatewayKeyIdFor(String provider) {
        if ("RAZORPAY".equals(provider)) {
            return razorpayGatewayService.getKeyId();
        }
        return null;
    }

    private Integer nextAttemptNumber(Long orderId) {
        return paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId)
                .map(p -> p.getAttemptNumber() == null ? 1 : p.getAttemptNumber() + 1)
                .orElse(1);
    }

    private boolean isActive(Payment payment) {
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.INITIATED) {
            return false;
        }
        return !isExpired(payment);
    }

    private boolean isExpired(Payment payment) {
        LocalDateTime expiresAt = payment.getExpiresAt();
        if (expiresAt == null) {
            return false;
        }
        return expiresAt.isBefore(LocalDateTime.now());
    }

    private boolean isTerminalOrder(String status) {
        if (status == null) {
            return false;
        }
        return "PAID".equals(status) || "DELIVERED".equals(status) || "CANCELLED".equals(status);
    }

    private PaymentResponse toPaymentResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getProvider(),
                gatewayKeyIdFor(payment.getProvider()),
                payment.getStatus().name(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getAttemptNumber(),
                payment.getGatewayOrderId(),
                payment.getExpiresAt(),
                payment.getCreatedAt()
        );
    }

    private String normalizeProvider(String provider) {
        if (provider == null || provider.isBlank()) {
            return "MOCK";
        }
        return provider.trim().toUpperCase(Locale.ROOT);
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
}
