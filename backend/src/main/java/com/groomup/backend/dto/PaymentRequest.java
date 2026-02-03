package com.groomup.backend.dto;

import jakarta.validation.constraints.NotNull;

public class PaymentRequest {

    @NotNull
    private Long orderId;

    @NotNull
    private String provider;

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
}
