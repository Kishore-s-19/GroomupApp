package com.groomup.backend.service;

import com.groomup.backend.dto.OrderItemResponse;
import com.groomup.backend.dto.OrderRequest;
import com.groomup.backend.dto.OrderResponse;
import com.groomup.backend.model.*;
import com.groomup.backend.repository.CartRepository;
import com.groomup.backend.repository.OrderRepository;
import com.groomup.backend.repository.PaymentRepository;
import com.groomup.backend.repository.ProductRepository;
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
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final CartService cartService;

    public OrderService(
            OrderRepository orderRepository,
            CartRepository cartRepository,
            ProductRepository productRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            CartService cartService
    ) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.paymentRepository = paymentRepository;
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
            int quantity = cartItem.getQuantity();
            if (quantity <= 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid quantity");
            }

            Product product = cartItem.getProduct();
            if (product == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid product");
            }
            if (product.getStockQuantity() < quantity) {
                throw new ResponseStatusException(BAD_REQUEST, "Insufficient stock");
            }

            product.setStockQuantity(product.getStockQuantity() - quantity);
            productRepository.save(product);

            OrderItem orderItem = new OrderItem(
                    order,
                    product,
                    quantity,
                    product.getPrice()
            );
            order.addItem(orderItem);
            totalPrice = totalPrice.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
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

    @Transactional
    public OrderResponse cancelMyOrder(Long id) {
        User user = getCurrentUser();

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Access denied");
        }

        if (isTerminalOrder(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Order cannot be cancelled");
        }

        Payment latestPayment = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId()).orElse(null);
        if (latestPayment != null && latestPayment.getStatus() == PaymentStatus.SUCCESS) {
            throw new ResponseStatusException(BAD_REQUEST, "Order cannot be cancelled");
        }

        restoreStock(order);
        order.setStatus("CANCELLED");
        Order saved = orderRepository.save(order);

        if (latestPayment != null && (latestPayment.getStatus() == PaymentStatus.PENDING || latestPayment.getStatus() == PaymentStatus.INITIATED)) {
            latestPayment.setStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(latestPayment);
        }

        return toOrderResponse(saved);
    }

    @Transactional
    public OrderResponse markOrderDelivered(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!"PAID".equals(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Only PAID orders can be delivered");
        }

        order.setStatus("DELIVERED");
        return toOrderResponse(orderRepository.save(order));
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

    private boolean isTerminalOrder(String status) {
        if (status == null) {
            return false;
        }
        return "PAID".equals(status) || "DELIVERED".equals(status) || "CANCELLED".equals(status);
    }

    private void restoreStock(Order order) {
        List<OrderItem> items = order.getItems();
        if (items == null || items.isEmpty()) {
            return;
        }
        for (OrderItem item : items) {
            Product product = item.getProduct();
            if (product == null) {
                continue;
            }
            int restoreQty = item.getQuantity();
            if (restoreQty <= 0) {
                continue;
            }
            product.setStockQuantity(product.getStockQuantity() + restoreQty);
            productRepository.save(product);
        }
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
