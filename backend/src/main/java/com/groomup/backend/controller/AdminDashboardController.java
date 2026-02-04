package com.groomup.backend.controller;

import com.groomup.backend.dto.DashboardStatsResponse;
import com.groomup.backend.model.Order;
import com.groomup.backend.repository.OrderRepository;
import com.groomup.backend.repository.ProductRepository;
import com.groomup.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AdminDashboardController(ProductRepository productRepository,
            OrderRepository orderRepository,
            UserRepository userRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/stats")
    public DashboardStatsResponse getDashboardStats() {
        long totalProducts = productRepository.count();
        long totalUsers = userRepository.count();
        List<Order> allOrders = orderRepository.findAll();

        long totalOrders = allOrders.size();
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> !"CANCELLED".equals(o.getStatus()))
                .map(Order::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardStatsResponse response = new DashboardStatsResponse(totalProducts, totalOrders, totalRevenue,
                totalUsers);

        // Sales History (Last 7 days mock or calculated)
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd");
        Map<String, DashboardStatsResponse.SalesDataPoint> salesMap = new LinkedHashMap<>();

        allOrders.stream()
                .filter(o -> !"CANCELLED".equals(o.getStatus()) && o.getCreatedAt() != null)
                .sorted(Comparator.comparing(Order::getCreatedAt))
                .forEach(o -> {
                    String date = o.getCreatedAt().format(formatter);
                    DashboardStatsResponse.SalesDataPoint point = salesMap.getOrDefault(date,
                            new DashboardStatsResponse.SalesDataPoint(date, BigDecimal.ZERO, 0));
                    salesMap.put(date, new DashboardStatsResponse.SalesDataPoint(date,
                            point.getRevenue().add(o.getTotalPrice()),
                            point.getOrders() + 1));
                });

        response.setSalesHistory(new ArrayList<>(salesMap.values()));

        // Top Products (Based on simplified logic from orders)
        Map<String, Long> productSales = new HashMap<>();
        allOrders.stream()
                .filter(o -> !"CANCELLED".equals(o.getStatus()))
                .flatMap(o -> o.getItems().stream())
                .forEach(item -> {
                    String name = item.getProduct().getName();
                    productSales.put(name, productSales.getOrDefault(name, 0L) + item.getQuantity());
                });

        List<DashboardStatsResponse.TopProductData> topProducts = productSales.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> new DashboardStatsResponse.TopProductData(e.getKey(), e.getValue(), BigDecimal.ZERO))
                .collect(Collectors.toList());

        response.setTopProducts(topProducts);

        // Category Earnings
        Map<String, BigDecimal> categoryEarnings = new HashMap<>();
        allOrders.stream()
                .filter(o -> !"CANCELLED".equals(o.getStatus()))
                .flatMap(o -> o.getItems().stream())
                .forEach(item -> {
                    String cat = item.getProduct().getCategory();
                    if (cat == null)
                        cat = "Uncategorized";
                    categoryEarnings.put(cat, categoryEarnings.getOrDefault(cat, BigDecimal.ZERO)
                            .add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))));
                });

        response.setCategoryEarnings(categoryEarnings);

        return response;
    }
}
