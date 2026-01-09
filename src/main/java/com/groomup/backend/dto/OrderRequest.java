package com.groomup.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class OrderRequest {
    @NotBlank
    private String shippingAddress;

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
}
