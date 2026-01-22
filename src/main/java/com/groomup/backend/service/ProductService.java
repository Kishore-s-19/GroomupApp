package com.groomup.backend.service;

import com.groomup.backend.dto.ProductRequest;
import com.groomup.backend.model.Product;
import com.groomup.backend.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Retryable(
        retryFor = {ObjectOptimisticLockingFailureException.class, org.springframework.transaction.TransactionSystemException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 100, multiplier = 2)
    )
    public Product updateProduct(Long id, ProductRequest request) {
        log.info("Attempting to update product: {}", id);
        return performUpdate(id, request);
    }

    @Transactional
    public Product performUpdate(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        
        applyProductRequest(product, request);
        Product saved = productRepository.saveAndFlush(product);
        log.info("Product updated and flushed: {}", id);
        return saved;
    }

    public void applyProductRequest(Product product, ProductRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Name is required");
        }
        if (request.getPrice() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Price is required");
        }
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(request.getCategory());
        product.setStockQuantity(request.getStockQuantity());
        
        // Map stock if provided, otherwise sync with stockQuantity
        if (request.getStock() != null) {
            product.setStock(request.getStock());
        } else if (product.getStock() == null) {
            product.setStock(request.getStockQuantity());
        }
        
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        if (request.getCareGuide() != null) product.setCareGuide(request.getCareGuide());
        if (request.getColorsJson() != null) product.setColorsJson(request.getColorsJson());
        if (request.getDeliveryInfo() != null) product.setDeliveryInfo(request.getDeliveryInfo());
        if (request.getFitJson() != null) product.setFitJson(request.getFitJson());
        if (request.getFitNote() != null) product.setFitNote(request.getFitNote());
        if (request.getMaterials() != null) product.setMaterials(request.getMaterials());
        if (request.getRating() != null) product.setRating(request.getRating());
        if (request.getReviewsCount() != null) product.setReviewsCount(request.getReviewsCount());
        if (request.getSizesJson() != null) product.setSizesJson(request.getSizesJson());
        if (request.getSourceId() != null) product.setSourceId(request.getSourceId());
        if (request.getActive() != null) product.setActive(request.getActive());
    }
}
