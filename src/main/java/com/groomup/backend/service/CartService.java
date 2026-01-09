package com.groomup.backend.service;

import com.groomup.backend.dto.CartItemResponse;
import com.groomup.backend.dto.CartResponse;
import com.groomup.backend.model.Cart;
import com.groomup.backend.model.CartItem;
import com.groomup.backend.model.Product;
import com.groomup.backend.model.User;
import com.groomup.backend.repository.CartItemRepository;
import com.groomup.backend.repository.CartRepository;
import com.groomup.backend.repository.ProductRepository;
import com.groomup.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                       ProductRepository productRepository, UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public CartResponse getMyCart() {
        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);
        return toCartResponse(cart);
    }

    public CartResponse addToCart(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Quantity must be greater than 0");
        }
        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(cart, product, quantity);
            cart.addItem(newItem);
            cartItemRepository.save(newItem);
        }

        Cart refreshedCart = cartRepository.findById(cart.getId()).orElse(cart);
        return toCartResponse(refreshedCart);
    }

    public CartResponse clearMyCart() {
        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartRepository.save(cart);
        return toCartResponse(cart);
    }

    public CartResponse updateCartItemQuantity(Long cartItemId, int quantity) {
        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
             throw new ResponseStatusException(UNAUTHORIZED, "Access denied");
        }

        if (quantity <= 0) {
            cart.removeItem(item);
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        
        // Reload cart to ensure fresh state
        cart = cartRepository.findById(cart.getId()).orElse(cart);

        return toCartResponse(cart);
    }

    public CartResponse removeFromCart(Long cartItemId) {
        User user = getCurrentUser();
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Access denied");
        }

        cart.removeItem(item);
        cartItemRepository.delete(item);
        
        // Reload cart
        cart = cartRepository.findById(cart.getId()).orElse(cart);

        return toCartResponse(cart);
    }
    
    public void clearCart(User user) {
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "User is not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> cartRepository.save(new Cart(user)));
    }

    private CartResponse toCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(this::toCartItemResponse)
                .collect(Collectors.toList());

        BigDecimal totalPrice = itemResponses.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(cart.getId(), itemResponses, totalPrice);
    }

    private CartItemResponse toCartItemResponse(CartItem item) {
        return new CartItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getImageUrl(),
                item.getProduct().getPrice(),
                item.getQuantity()
        );
    }
}
