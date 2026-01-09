package com.groomup.backend.controller;

import com.groomup.backend.dto.ProductRequest;
import com.groomup.backend.dto.ProductResponse;
import com.groomup.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // =======================
    // CREATE (POST)
    // =======================
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    // =======================
    // READ ALL (GET)
    // =======================
    @GetMapping
    public List<ProductResponse> getProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category
    ) {
        return productService.getProducts(q, category);
    }

    // =======================
    // READ ONE (GET)
    // =======================
    @GetMapping("/{id}")
    public ProductResponse getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    // =======================
    // UPDATE (PUT)
    // =======================
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    // =======================
    // DELETE (SOFT DELETE)
    // =======================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
