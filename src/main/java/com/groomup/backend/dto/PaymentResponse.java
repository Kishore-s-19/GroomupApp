package com.groomup.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private Long paymentId;
    private Long orderId;
    private String provider;
    private String gatewayKeyId;
    private String status;
    private BigDecimal amount;
    private String currency;
    private Integer attemptNumber;
    private String gatewayOrderId;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    public PaymentResponse(
            Long paymentId,
            Long orderId,
            String provider,
            String gatewayKeyId,
            String status,
            BigDecimal amount,
            String currency,
            Integer attemptNumber,
            String gatewayOrderId,
            LocalDateTime expiresAt,
            LocalDateTime createdAt
    ) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.provider = provider;
        this.gatewayKeyId = gatewayKeyId;
        this.status = status;
        this.amount = amount;
        this.currency = currency;
        this.attemptNumber = attemptNumber;
        this.gatewayOrderId = gatewayOrderId;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getGatewayKeyId() {
        return gatewayKeyId;
    }

    public void setGatewayKeyId(String gatewayKeyId) {
        this.gatewayKeyId = gatewayKeyId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public String getGatewayOrderId() {
        return gatewayOrderId;
    }

    public void setGatewayOrderId(String gatewayOrderId) {
        this.gatewayOrderId = gatewayOrderId;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
