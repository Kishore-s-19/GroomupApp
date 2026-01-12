package com.groomup.backend.dto;

import java.math.BigDecimal;

public class PaymentResponse {

    private Long paymentId;
    private Long orderId;
    private String provider;
    private String status;
    private BigDecimal amount;
    private String currency;
    private String gatewayOrderId;
    private String gatewayKeyId;

    public PaymentResponse() {
    }

    public PaymentResponse(
            Long paymentId,
            Long orderId,
            String provider,
            String status,
            BigDecimal amount,
            String currency,
            String gatewayOrderId,
            String gatewayKeyId
    ) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.provider = provider;
        this.status = status;
        this.amount = amount;
        this.currency = currency;
        this.gatewayOrderId = gatewayOrderId;
        this.gatewayKeyId = gatewayKeyId;
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

    public String getGatewayOrderId() {
        return gatewayOrderId;
    }

    public void setGatewayOrderId(String gatewayOrderId) {
        this.gatewayOrderId = gatewayOrderId;
    }

    public String getGatewayKeyId() {
        return gatewayKeyId;
    }

    public void setGatewayKeyId(String gatewayKeyId) {
        this.gatewayKeyId = gatewayKeyId;
    }
}
