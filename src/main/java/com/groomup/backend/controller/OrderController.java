package com.groomup.backend.controller;

import com.groomup.backend.dto.OrderItemRequest;
import com.groomup.backend.dto.OrderItemResponse;
import com.groomup.backend.dto.OrderRequest;
import com.groomup.backend.dto.OrderResponse;
import com.groomup.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse createOrder(@RequestBody @Valid OrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping
    public List<OrderResponse> getMyOrders() {
        return orderService.getMyOrders();
    }

    @GetMapping("/{id}")
    public OrderResponse getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @PutMapping("/{id}")
    public OrderResponse updateShippingAddress(@PathVariable Long id, @RequestBody @Valid OrderRequest request) {
        return orderService.updateShippingAddress(id, request);
    }

    @PutMapping("/{id}/cancel")
    public OrderResponse cancelOrder(@PathVariable Long id) {
        return orderService.cancelOrder(id);
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
    }

    @GetMapping("/all")
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }

    @PutMapping("/{id}/status")
    public OrderResponse updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        return orderService.updateOrderStatus(id, status);
    }

    @GetMapping("/{orderId}/items")
    public List<OrderItemResponse> getOrderItems(@PathVariable Long orderId) {
        return orderService.getOrderItems(orderId);
    }

    @GetMapping("/{orderId}/items/{itemId}")
    public OrderItemResponse getOrderItem(@PathVariable Long orderId, @PathVariable Long itemId) {
        return orderService.getOrderItem(orderId, itemId);
    }

    @PostMapping("/{orderId}/items")
    public OrderResponse addOrderItem(@PathVariable Long orderId, @RequestBody @Valid OrderItemRequest request) {
        return orderService.addOrderItem(orderId, request);
    }

    @PutMapping("/{orderId}/items/{itemId}")
    public OrderResponse updateOrderItem(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestBody @Valid OrderItemRequest request
    ) {
        return orderService.updateOrderItem(orderId, itemId, request);
    }

    @DeleteMapping("/{orderId}/items/{itemId}")
    public OrderResponse deleteOrderItem(@PathVariable Long orderId, @PathVariable Long itemId) {
        return orderService.deleteOrderItem(orderId, itemId);
    }
}
