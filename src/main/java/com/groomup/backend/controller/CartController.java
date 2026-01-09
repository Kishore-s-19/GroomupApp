package com.groomup.backend.controller;

import com.groomup.backend.dto.CartItemRequest;
import com.groomup.backend.dto.CartResponse;
import com.groomup.backend.service.CartService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse getMyCart() {
        return cartService.getMyCart();
    }

    @PostMapping("/items")
    public CartResponse addItem(@Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(request.getProductId(), request.getQuantity());
    }

    @PutMapping("/items/{productId}")
    public CartResponse updateItemQuantity(@PathVariable Long productId, @Valid @RequestBody CartItemRequest request) {
        if (request.getProductId() == null || !request.getProductId().equals(productId)) {
            request.setProductId(productId);
        }
        return cartService.updateItemQuantity(productId, request.getQuantity());
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse removeItem(@PathVariable Long productId) {
        return cartService.removeItem(productId);
    }

    @DeleteMapping
    public CartResponse clearCart() {
        return cartService.clearCart();
    }
}

