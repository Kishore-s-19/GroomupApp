package com.groomup.backend.service;

import com.groomup.backend.dto.CartItemResponse;
import com.groomup.backend.dto.CartResponse;
import com.groomup.backend.model.Cart;
import com.groomup.backend.model.CartItem;
import com.groomup.backend.model.Product;
import com.groomup.backend.model.User;
import com.groomup.backend.repository.CartRepository;
import com.groomup.backend.repository.ProductRepository;
import com.groomup.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, UserRepository userRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public CartResponse getMyCart() {
        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(Long productId, int quantity) {
        if (quantity < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "Quantity must be at least 1");
        }

        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);
        Product product = productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(i -> i.getProduct() != null && productId.equals(i.getProduct().getId()))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(quantity);
            cart.getItems().add(item);
        }

        Cart saved = cartRepository.save(cart);
        return toResponse(saved);
    }

    @Transactional
    public CartResponse updateItemQuantity(Long productId, int quantity) {
        if (quantity < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Quantity cannot be negative");
        }

        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProduct() != null && productId.equals(i.getProduct().getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found in cart"));

        if (quantity == 0) {
            cart.getItems().remove(item);
        } else {
            item.setQuantity(quantity);
        }

        Cart saved = cartRepository.save(cart);
        return toResponse(saved);
    }

    @Transactional
    public CartResponse removeItem(Long productId) {
        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);
        boolean removed = cart.getItems().removeIf(i -> i.getProduct() != null && productId.equals(i.getProduct().getId()));
        if (!removed) {
            throw new ResponseStatusException(NOT_FOUND, "Item not found in cart");
        }

        Cart saved = cartRepository.save(cart);
        return toResponse(saved);
    }

    @Transactional
    public CartResponse clearCart() {
        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        Cart saved = cartRepository.save(cart);
        return toResponse(saved);
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId()).orElseGet(() -> {
            Cart cart = new Cart();
            cart.setUser(user);
            return cartRepository.save(cart);
        });
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .filter(i -> i.getProduct() != null && i.getProduct().isActive())
                .sorted(Comparator.comparing(CartItem::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(i -> {
                    Product p = i.getProduct();
                    BigDecimal lineTotal = p.getPrice().multiply(BigDecimal.valueOf(i.getQuantity()));
                    return new CartItemResponse(
                            p.getId(),
                            p.getName(),
                            p.getPrice(),
                            p.getImageUrl(),
                            i.getQuantity(),
                            lineTotal
                    );
                })
                .toList();

        BigDecimal totalAmount = items.stream()
                .map(CartItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = items.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return new CartResponse(cart.getId(), items, totalAmount, totalItems);
    }
}
