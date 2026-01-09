package com.groomup.backend.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductResponse {

    private Long id;
    private String name;
    private String brand;
    private String description;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String imageUrl;
    private String category;
    private String fitNote;
    private String materials;
    private String careGuide;
    private String deliveryInfo;
    private Double rating;
    private Integer reviews;
    private List<String> images = new ArrayList<>();
    private List<ProductColorResponse> colors = new ArrayList<>();
    private List<String> sizes = new ArrayList<>();
    private ProductFitResponse fit;

    public ProductResponse() {}

    public ProductResponse(
            Long id,
            String name,
            String brand,
            String description,
            BigDecimal price,
            BigDecimal originalPrice,
            String imageUrl,
            String category,
            String fitNote,
            String materials,
            String careGuide,
            String deliveryInfo,
            Double rating,
            Integer reviews,
            List<String> images,
            List<ProductColorResponse> colors,
            List<String> sizes,
            ProductFitResponse fit
    ) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.description = description;
        this.price = price;
        this.originalPrice = originalPrice;
        this.imageUrl = imageUrl;
        this.category = category;
        this.fitNote = fitNote;
        this.materials = materials;
        this.careGuide = careGuide;
        this.deliveryInfo = deliveryInfo;
        this.rating = rating;
        this.reviews = reviews;
        this.images = images;
        this.colors = colors;
        this.sizes = sizes;
        this.fit = fit;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getFitNote() {
        return fitNote;
    }

    public void setFitNote(String fitNote) {
        this.fitNote = fitNote;
    }

    public String getMaterials() {
        return materials;
    }

    public void setMaterials(String materials) {
        this.materials = materials;
    }

    public String getCareGuide() {
        return careGuide;
    }

    public void setCareGuide(String careGuide) {
        this.careGuide = careGuide;
    }

    public String getDeliveryInfo() {
        return deliveryInfo;
    }

    public void setDeliveryInfo(String deliveryInfo) {
        this.deliveryInfo = deliveryInfo;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getReviews() {
        return reviews;
    }

    public void setReviews(Integer reviews) {
        this.reviews = reviews;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<ProductColorResponse> getColors() {
        return colors;
    }

    public void setColors(List<ProductColorResponse> colors) {
        this.colors = colors;
    }

    public List<String> getSizes() {
        return sizes;
    }

    public void setSizes(List<String> sizes) {
        this.sizes = sizes;
    }

    public ProductFitResponse getFit() {
        return fit;
    }

    public void setFit(ProductFitResponse fit) {
        this.fit = fit;
    }
}
