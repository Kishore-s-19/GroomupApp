package com.groomup.backend.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
    @Table(
        name = "products",
        indexes = {
                @Index(name = "idx_products_category", columnList = "category"),
                @Index(name = "idx_products_created_at", columnList = "created_at")
        }
    )
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2048)
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Column(precision = 19, scale = 2)
    private BigDecimal originalPrice;

    @Column(length = 2048)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String imagesJson;

    @Column(length = 128)
    private String category;

    @Column(nullable = false)
    private Integer stockQuantity = 0;

    @Column
    private Integer stock;

    @Column(nullable = false)
    private Integer reservedQuantity = 0;

    @Column
    private String brand;

    @Column(columnDefinition = "TEXT")
    private String careGuide;

    @Column(columnDefinition = "TEXT")
    private String colorsJson;

    @Column(columnDefinition = "TEXT")
    private String deliveryInfo;

    @Column(columnDefinition = "TEXT")
    private String fitJson;

    @Column
    private String fitNote;

    @Column(columnDefinition = "TEXT")
    private String materials;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column
    private Integer reviewsCount;

    @Column(columnDefinition = "TEXT")
    private String sizesJson;

    @Column
    private Integer sourceId;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    public Product() {
    }

    @PostLoad
    protected void repairLegacyData() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = this.createdAt;
        }
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
        if (this.reservedQuantity == null) {
            this.reservedQuantity = 0;
        }
        if (this.active == null) {
            this.active = true;
        }
        if (this.version == null) {
            this.version = 0L;
        }
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

    public Integer getStockQuantity() {
        return stockQuantity != null ? stockQuantity : 0;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
    }

    public Integer getReservedQuantity() {
        return reservedQuantity != null ? reservedQuantity : 0;
    }

    public void setReservedQuantity(Integer reservedQuantity) {
        this.reservedQuantity = reservedQuantity != null ? reservedQuantity : 0;
    }

    public int getAvailableQuantity() {
        return getStockQuantity() - getReservedQuantity();
    }

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public String getImagesJson() {
        return imagesJson;
    }

    public void setImagesJson(String imagesJson) {
        this.imagesJson = imagesJson;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCareGuide() {
        return careGuide;
    }

    public void setCareGuide(String careGuide) {
        this.careGuide = careGuide;
    }

    public String getColorsJson() {
        return colorsJson;
    }

    public void setColorsJson(String colorsJson) {
        this.colorsJson = colorsJson;
    }

    public String getDeliveryInfo() {
        return deliveryInfo;
    }

    public void setDeliveryInfo(String deliveryInfo) {
        this.deliveryInfo = deliveryInfo;
    }

    public String getFitJson() {
        return fitJson;
    }

    public void setFitJson(String fitJson) {
        this.fitJson = fitJson;
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

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public Integer getReviewsCount() {
        return reviewsCount;
    }

    public void setReviewsCount(Integer reviewsCount) {
        this.reviewsCount = reviewsCount;
    }

    public String getSizesJson() {
        return sizesJson;
    }

    public void setSizesJson(String sizesJson) {
        this.sizesJson = sizesJson;
    }

    public Integer getSourceId() {
        return sourceId;
    }

    public void setSourceId(Integer sourceId) {
        this.sourceId = sourceId;
    }

    public Boolean isActive() {
        return active != null ? active : true;
    }

    public void setActive(Boolean active) {
        this.active = active != null ? active : true;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.version == null) {
            this.version = 0L;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        LocalDateTime now = LocalDateTime.now();
        this.updatedAt = now;
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.version == null) {
            this.version = 0L;
        }
    }
}
