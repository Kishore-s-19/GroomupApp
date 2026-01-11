package com.groomup.backend.service;

import com.groomup.backend.dto.OrderItemResponse;
import com.groomup.backend.dto.OrderItemRequest;
import com.groomup.backend.dto.OrderRequest;
import com.groomup.backend.dto.OrderResponse;
import com.groomup.backend.model.*;
import com.groomup.backend.repository.CartRepository;
import com.groomup.backend.repository.OrderItemRepository;
import com.groomup.backend.repository.OrderRepository;
import com.groomup.backend.repository.ProductRepository;
import com.groomup.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        CartRepository cartRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        User user = getCurrentUser();
        Cart cart = cartRepository.findByUserForUpdate(user)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Cart is empty");
        }

        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(request.getShippingAddress());
        order.setStatus("PENDING");

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            if (cartItem.getQuantity() <= 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid cart quantity");
            }
            Product product = productRepository.findByIdForUpdate(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new ResponseStatusException(CONFLICT, "Insufficient stock for product: " + product.getName());
            }
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem(
                    order,
                    product,
                    cartItem.getQuantity(),
                    product.getPrice()
            );
            order.addItem(orderItem);
            totalAmount = totalAmount.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);

        cart.getItems().clear();
        cartRepository.save(cart);

        return toOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders() {
        User user = getCurrentUser();
        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);
        return orders.stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        User user = getCurrentUser();
        Order order = orderRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!isAdmin(user) && !order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }

        return toOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateShippingAddress(Long id, OrderRequest request) {
        User user = getCurrentUser();
        Order order = orderRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Order cannot be updated");
        }

        order.setShippingAddress(request.getShippingAddress());
        return toOrderResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(Long id) {
        User user = getCurrentUser();
        Order order = orderRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Order cannot be cancelled");
        }

        order.setStatus("CANCELLED");
        restoreStock(order);
        return toOrderResponse(orderRepository.save(order));
    }

    @Transactional
    public void deleteOrder(Long id) {
        User user = getCurrentUser();
        Order order = orderRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (isAdmin(user)) {
            restoreStockIfPending(order);
            orderRepository.delete(order);
            return;
        }

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Order cannot be deleted");
        }

        restoreStock(order);
        orderRepository.delete(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        User user = getCurrentUser();
        requireAdmin(user);
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, String status) {
        User user = getCurrentUser();
        requireAdmin(user);

        String normalized = normalizeStatus(status);
        Order order = orderRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        String current = normalizeStatus(order.getStatus());
        if (!isAllowedStatus(normalized)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid status");
        }

        if ("DELIVERED".equals(current) && !"DELIVERED".equals(normalized)) {
            throw new ResponseStatusException(BAD_REQUEST, "Delivered order cannot change status");
        }
        if ("CANCELLED".equals(current) && !"CANCELLED".equals(normalized)) {
            throw new ResponseStatusException(BAD_REQUEST, "Cancelled order cannot change status");
        }
        if ("CANCELLED".equals(normalized) && !"PENDING".equals(current)) {
            throw new ResponseStatusException(BAD_REQUEST, "Only pending orders can be cancelled");
        }

        order.setStatus(normalized);
        if ("CANCELLED".equals(normalized)) {
            restoreStock(order);
        }
        return toOrderResponse(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderItemResponse> getOrderItems(Long orderId) {
        User user = getCurrentUser();
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!isAdmin(user) && !order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }

        return order.getItems().stream()
                .map(this::toOrderItemResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderItemResponse getOrderItem(Long orderId, Long itemId) {
        User user = getCurrentUser();
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!isAdmin(user) && !order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }

        OrderItem item = orderItemRepository.findByIdAndOrderId(itemId, orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order item not found"));

        return toOrderItemResponse(item);
    }

    @Transactional
    public OrderResponse addOrderItem(Long orderId, OrderItemRequest request) {
        User user = getCurrentUser();
        requireAdmin(user);

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Quantity must be greater than 0");
        }
        if (request.getProductId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Product ID is required");
        }

        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Order cannot be modified");
        }

        Product product = productRepository.findByIdForUpdate(request.getProductId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        if (product.getStockQuantity() < request.getQuantity()) {
            throw new ResponseStatusException(CONFLICT, "Insufficient stock");
        }

        product.setStockQuantity(product.getStockQuantity() - request.getQuantity());
        productRepository.save(product);

        OrderItem item = new OrderItem(order, product, request.getQuantity(), product.getPrice());
        order.addItem(item);
        recalcTotalPrice(order);

        return toOrderResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateOrderItem(Long orderId, Long itemId, OrderItemRequest request) {
        User user = getCurrentUser();
        requireAdmin(user);

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Quantity must be greater than 0");
        }

        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Order cannot be modified");
        }

        OrderItem item = orderItemRepository.findByIdAndOrderId(itemId, orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order item not found"));

        Product currentProduct = item.getProduct();
        int oldQty = item.getQuantity();
        int newQty = request.getQuantity();

        if (request.getProductId() != null && !request.getProductId().equals(currentProduct.getId())) {
            Product newProduct = productRepository.findByIdForUpdate(request.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));

            currentProduct.setStockQuantity(currentProduct.getStockQuantity() + oldQty);
            productRepository.save(currentProduct);

            if (newProduct.getStockQuantity() < newQty) {
                throw new ResponseStatusException(CONFLICT, "Insufficient stock");
            }
            newProduct.setStockQuantity(newProduct.getStockQuantity() - newQty);
            productRepository.save(newProduct);

            item.setProduct(newProduct);
            item.setPrice(newProduct.getPrice());
            item.setQuantity(newQty);
        } else {
            int diff = newQty - oldQty;
            if (diff > 0) {
                if (currentProduct.getStockQuantity() < diff) {
                    throw new ResponseStatusException(CONFLICT, "Insufficient stock");
                }
                currentProduct.setStockQuantity(currentProduct.getStockQuantity() - diff);
                productRepository.save(currentProduct);
            } else if (diff < 0) {
                currentProduct.setStockQuantity(currentProduct.getStockQuantity() + Math.abs(diff));
                productRepository.save(currentProduct);
            }
            item.setQuantity(newQty);
        }

        orderItemRepository.save(item);
        recalcTotalPrice(order);
        return toOrderResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse deleteOrderItem(Long orderId, Long itemId) {
        User user = getCurrentUser();
        requireAdmin(user);

        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Order cannot be modified");
        }

        OrderItem item = orderItemRepository.findByIdAndOrderId(itemId, orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order item not found"));

        Product product = item.getProduct();
        product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
        productRepository.save(product);

        order.getItems().remove(item);
        orderItemRepository.delete(item);

        recalcTotalPrice(order);
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

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getImageUrl(),
                        item.getPrice(),
                        item.getQuantity()
                ))
                .collect(Collectors.toList());

        return new OrderResponse(
                order.getId(),
                order.getUser().getId(),
                itemResponses,
                order.getTotalAmount(),
                order.getStatus(),
                order.getShippingAddress(),
                order.getCreatedAt()
        );
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getImageUrl(),
                item.getPrice(),
                item.getQuantity()
        );
    }

    private void recalcTotalPrice(Order order) {
        BigDecimal total = order.getItems().stream()
                .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(total);
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }
    }

    private void restoreStockIfPending(Order order) {
        if ("PENDING".equalsIgnoreCase(order.getStatus())) {
            restoreStock(order);
        }
    }

    private boolean isAdmin(User user) {
        return "ADMIN".equalsIgnoreCase(user.getRole());
    }

    private void requireAdmin(User user) {
        if (!isAdmin(user)) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }
    }

    private boolean isAllowedStatus(String status) {
        return "PENDING".equals(status) || "DELIVERED".equals(status) || "CANCELLED".equals(status);
    }

    private String normalizeStatus(String status) {
        if (status == null) {
            return "";
        }
        return status.trim().toUpperCase(Locale.ROOT);
    }
}
