package com.groomup.backend.dto;

import java.math.BigDecimal;

public class CartItemResponse {

    private Long productId;
    private String name;
    private BigDecimal price;
    private String imageUrl;
    private int quantity;
    private BigDecimal lineTotal;

    public CartItemResponse() {}

    public CartItemResponse(
            Long productId,
            String name,
            BigDecimal price,
            String imageUrl,
            int quantity,
            BigDecimal lineTotal
    ) {
        this.productId = productId;
        this.name = name;
        this.price = price;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
        this.lineTotal = lineTotal;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}

