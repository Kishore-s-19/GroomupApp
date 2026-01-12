package com.groomup.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {
    private Long id;
    private List<OrderItemResponse> items;
    private BigDecimal totalPrice;
    private String status;
    private String shippingAddress;
    private LocalDateTime createdAt;

    public OrderResponse(Long id, List<OrderItemResponse> items, BigDecimal totalPrice, String status, String shippingAddress, LocalDateTime createdAt) {
        this.id = id;
        this.items = items;
        this.totalPrice = totalPrice;
        this.status = status;
        this.shippingAddress = shippingAddress;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
