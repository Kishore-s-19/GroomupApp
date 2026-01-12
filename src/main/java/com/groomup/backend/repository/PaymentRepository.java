package com.groomup.backend.repository;

import com.groomup.backend.model.Payment;
import com.groomup.backend.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findTopByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<Payment> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);

    Optional<Payment> findByGatewayPaymentId(String gatewayPaymentId);

    List<Payment> findByStatusAndExpiresAtBefore(PaymentStatus status, LocalDateTime before);
}

