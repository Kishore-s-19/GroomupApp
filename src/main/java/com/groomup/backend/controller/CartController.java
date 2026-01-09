package com.groomup.backend.controller;

import com.groomup.backend.dto.CartRequest;
import com.groomup.backend.dto.CartResponse;
import com.groomup.backend.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/add")
    public CartResponse addToCart(@RequestBody CartRequest request) {
        return cartService.addToCart(request.getProductId(), request.getQuantity());
    }

    @PutMapping("/items/{itemId}")
    public CartResponse updateCartItem(@PathVariable Long itemId, @RequestBody CartRequest request) {
        return cartService.updateCartItemQuantity(itemId, request.getQuantity());
    }

    @DeleteMapping("/items/{itemId}")
    public CartResponse removeFromCart(@PathVariable Long itemId) {
        return cartService.removeFromCart(itemId);
    }
}
