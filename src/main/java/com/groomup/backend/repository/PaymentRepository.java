package com.groomup.backend.repository;

import com.groomup.backend.model.PaymentStatus;
import com.groomup.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findTopByOrderIdOrderByCreatedAtDesc(Long orderId);
    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);
    List<Payment> findByStatusAndExpiresAtBefore(PaymentStatus status, LocalDateTime now);
}
