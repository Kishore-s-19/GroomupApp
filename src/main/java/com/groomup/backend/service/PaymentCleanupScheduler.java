package com.groomup.backend.service;

import com.groomup.backend.model.Order;
import com.groomup.backend.model.OrderItem;
import com.groomup.backend.model.Payment;
import com.groomup.backend.model.PaymentStatus;
import com.groomup.backend.model.Product;
import com.groomup.backend.repository.OrderRepository;
import com.groomup.backend.repository.PaymentRepository;
import com.groomup.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentCleanupScheduler {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Value("${payments.cleanup.enabled:true}")
    private boolean cleanupEnabled;

    public PaymentCleanupScheduler(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            ProductRepository productRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Scheduled(fixedDelayString = "${payments.cleanup.fixed-delay-ms:60000}")
    @Transactional
    public void cleanupExpiredPaymentsAndOrders() {
        if (!cleanupEnabled) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        expireAndCleanup(paymentRepository.findByStatusAndExpiresAtBefore(PaymentStatus.PENDING, now));
        expireAndCleanup(paymentRepository.findByStatusAndExpiresAtBefore(PaymentStatus.INITIATED, now));
    }

    private void expireAndCleanup(List<Payment> expiredPayments) {
        for (Payment payment : expiredPayments) {
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                continue;
            }
            if (payment.getStatus() == PaymentStatus.EXPIRED) {
                continue;
            }

            Payment latest = paymentRepository
                    .findTopByOrderIdOrderByCreatedAtDesc(payment.getOrder().getId())
                    .orElse(null);

            payment.setStatus(PaymentStatus.EXPIRED);
            paymentRepository.save(payment);

            if (latest == null || !latest.getId().equals(payment.getId())) {
                continue;
            }

            Order order = payment.getOrder();
            if (order == null) {
                continue;
            }

            if (isTerminalOrder(order.getStatus())) {
                continue;
            }

            if (!"PENDING".equals(order.getStatus()) && !"FAILED".equals(order.getStatus())) {
                continue;
            }

            restoreStock(order);
            order.setStatus("CANCELLED");
            orderRepository.save(order);
        }
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
            int restoreQty = item.getQuantity();
            if (restoreQty <= 0) {
                continue;
            }
            product.setStockQuantity(product.getStockQuantity() + restoreQty);
            productRepository.save(product);
        }
    }
}

