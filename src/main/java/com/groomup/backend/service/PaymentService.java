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

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final RazorpayGatewayService razorpayGatewayService;

    public PaymentService(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            RazorpayGatewayService razorpayGatewayService
    ) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.razorpayGatewayService = razorpayGatewayService;
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

        Payment latest = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
        int attemptNumber = latest == null ? 1 : (latest.getAttemptNumber() == null ? 1 : latest.getAttemptNumber() + 1);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider("RAZORPAY");
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setAmount(order.getTotalPrice());
        payment.setCurrency("INR");
        payment.setAttemptNumber(attemptNumber);
        payment.setExpiresAt(LocalDateTime.now().plusMinutes(15));

        String receipt = "order_" + order.getId() + "_attempt_" + attemptNumber;
        String gatewayOrderId = razorpayGatewayService.createOrder(payment.getAmount(), payment.getCurrency(), receipt);
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
