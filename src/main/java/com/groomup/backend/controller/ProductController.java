package com.groomup.backend.controller;

import com.groomup.backend.dto.ProductRequest;
import com.groomup.backend.model.Product;
import com.groomup.backend.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
    }

    @PostMapping
    public Product createProduct(@RequestBody ProductRequest request) {
        Product product = new Product();
        applyProductRequest(product, request);
        return productRepository.save(product);
    }

    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        applyProductRequest(product, request);
        return productRepository.save(product);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Product not found");
        }
        productRepository.deleteById(id);
    }

    private void applyProductRequest(Product product, ProductRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Name is required");
        }
        if (request.getPrice() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Price is required");
        }
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(request.getCategory());
        product.setStockQuantity(request.getStockQuantity());
    }
}
