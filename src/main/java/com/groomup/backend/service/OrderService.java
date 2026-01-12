package com.groomup.backend.service;

import com.groomup.backend.dto.OrderItemResponse;
import com.groomup.backend.dto.OrderRequest;
import com.groomup.backend.dto.OrderResponse;
import com.groomup.backend.model.*;
import com.groomup.backend.repository.CartRepository;
import com.groomup.backend.repository.OrderRepository;
import com.groomup.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final CartService cartService;

    public OrderService(OrderRepository orderRepository, CartRepository cartRepository,
                        UserRepository userRepository, CartService cartService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.cartService = cartService;
    }

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        User user = getCurrentUser();
        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Cart is empty");
        }

        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(request.getShippingAddress());
        order.setStatus("PENDING");

        BigDecimal totalPrice = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem(
                    order,
                    cartItem.getProduct(),
                    cartItem.getQuantity(),
                    cartItem.getProduct().getPrice()
            );
            order.addItem(orderItem);
            totalPrice = totalPrice.add(cartItem.getProduct().getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        order.setTotalPrice(totalPrice);
        Order savedOrder = orderRepository.save(order);

        // Clear cart after order is placed
        cartService.clearCart(user);

        return toOrderResponse(savedOrder);
    }

    public List<OrderResponse> getMyOrders() {
        User user = getCurrentUser();
        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);
        return orders.stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long id) {
        User user = getCurrentUser();
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Access denied");
        }

        return toOrderResponse(order);
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

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getImageUrl(),
                        item.getPrice(),
                        item.getQuantity()
                ))
                .collect(Collectors.toList());

        return new OrderResponse(
                order.getId(),
                itemResponses,
                order.getTotalPrice(),
                order.getStatus(),
                order.getShippingAddress(),
                order.getCreatedAt()
        );
    }
}
