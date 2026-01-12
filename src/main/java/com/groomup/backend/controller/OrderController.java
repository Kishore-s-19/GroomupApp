package com.groomup.backend.controller;

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
}
