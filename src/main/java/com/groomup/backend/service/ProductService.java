package com.groomup.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.groomup.backend.dto.ProductColorResponse;
import com.groomup.backend.dto.ProductFitResponse;
import com.groomup.backend.dto.ProductRequest;
import com.groomup.backend.dto.ProductResponse;
import com.groomup.backend.model.Product;
import com.groomup.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public ProductService(ProductRepository productRepository, ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    // =======================
    // CREATE
    // =======================
    public ProductResponse createProduct(ProductRequest request) {

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(request.getCategory());
        product.setActive(true);

        Product saved = productRepository.save(product);
        return toResponse(saved);
    }

    // =======================
    // READ ALL
    // =======================
    public List<ProductResponse> getProducts(String q, String category) {
        String normalizedQuery = normalize(q);
        String normalizedCategory = normalize(category);

        List<Product> products;
        if (normalizedQuery != null && normalizedCategory != null) {
            products = productRepository
                    .findByNameContainingIgnoreCaseAndCategoryIgnoreCaseAndActiveTrueOrderByIdAsc(
                            normalizedQuery, normalizedCategory);
        } else if (normalizedQuery != null) {
            products = productRepository
                    .findByNameContainingIgnoreCaseAndActiveTrueOrderByIdAsc(normalizedQuery);
        } else if (normalizedCategory != null) {
            products = productRepository
                    .findByCategoryIgnoreCaseAndActiveTrueOrderByIdAsc(normalizedCategory);
        } else {
            products = productRepository.findByActiveTrueOrderByIdAsc();
        }

        return products.stream().map(this::toResponse).toList();
    }

    // =======================
    // READ ONE
    // =======================
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "Product not found")
                );

        return toResponse(product);
    }

    // =======================
    // UPDATE
    // =======================
    public ProductResponse updateProduct(Long id, ProductRequest request) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "Product not found")
                );

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(request.getCategory());

        Product updated = productRepository.save(product);
        return toResponse(updated);
    }

    // =======================
    // DELETE (SOFT DELETE)
    // =======================
    public void deleteProduct(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "Product not found")
                );

        product.setActive(false);
        productRepository.save(product);
    }

    // =======================
    // MAPPER
    // =======================
    private ProductResponse toResponse(Product product) {
        List<String> images = readJsonList(product.getImagesJson(), new TypeReference<>() {});
        List<String> sizes = readJsonList(product.getSizesJson(), new TypeReference<>() {});
        List<ProductColorResponse> colors = readJsonList(product.getColorsJson(), new TypeReference<>() {});
        ProductFitResponse fit = readJsonObject(product.getFitJson(), ProductFitResponse.class);

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getBrand(),
                product.getDescription(),
                product.getPrice(),
                product.getOriginalPrice(),
                product.getImageUrl(),
                product.getCategory(),
                product.getFitNote(),
                product.getMaterials(),
                product.getCareGuide(),
                product.getDeliveryInfo(),
                product.getRating() == null ? null : product.getRating().doubleValue(),
                product.getReviewsCount(),
                images,
                colors,
                sizes,
                fit
        );
    }

    // =======================
    // HELPERS
    // =======================
    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private <T> T readJsonObject(String json, Class<T> type) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, type);
        } catch (IOException e) {
            return null;
        }
    }

    private <T> T readJsonList(String json, TypeReference<T> typeRef) {
        if (json == null || json.isBlank()) {
            try {
                return objectMapper.readValue("[]", typeRef);
            } catch (IOException e) {
                return null;
            }
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (IOException e) {
            try {
                return objectMapper.readValue("[]", typeRef);
            } catch (IOException ex) {
                return null;
            }
        }
    }
}
