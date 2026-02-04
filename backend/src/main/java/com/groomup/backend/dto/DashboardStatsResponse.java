package com.groomup.backend.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {
    private long totalProducts;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long totalUsers;
    private List<SalesDataPoint> salesHistory;
    private List<TopProductData> topProducts;
    private Map<String, BigDecimal> categoryEarnings;

    public DashboardStatsResponse() {
    }

    public DashboardStatsResponse(long totalProducts, long totalOrders, BigDecimal totalRevenue, long totalUsers) {
        this.totalProducts = totalProducts;
        this.totalOrders = totalOrders;
        this.totalRevenue = totalRevenue;
        this.totalUsers = totalUsers;
    }

    // Getters and Setters
    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public List<SalesDataPoint> getSalesHistory() {
        return salesHistory;
    }

    public void setSalesHistory(List<SalesDataPoint> salesHistory) {
        this.salesHistory = salesHistory;
    }

    public List<TopProductData> getTopProducts() {
        return topProducts;
    }

    public void setTopProducts(List<TopProductData> topProducts) {
        this.topProducts = topProducts;
    }

    public Map<String, BigDecimal> getCategoryEarnings() {
        return categoryEarnings;
    }

    public void setCategoryEarnings(Map<String, BigDecimal> categoryEarnings) {
        this.categoryEarnings = categoryEarnings;
    }

    public static class SalesDataPoint {
        private String date;
        private BigDecimal revenue;
        private long orders;

        public SalesDataPoint(String date, BigDecimal revenue, long orders) {
            this.date = date;
            this.revenue = revenue;
            this.orders = orders;
        }

        public String getDate() {
            return date;
        }

        public BigDecimal getRevenue() {
            return revenue;
        }

        public long getOrders() {
            return orders;
        }
    }

    public static class TopProductData {
        private String name;
        private long quantity;
        private BigDecimal revenue;

        public TopProductData(String name, long quantity, BigDecimal revenue) {
            this.name = name;
            this.quantity = quantity;
            this.revenue = revenue;
        }

        public String getName() {
            return name;
        }

        public long getQuantity() {
            return quantity;
        }

        public BigDecimal getRevenue() {
            return revenue;
        }
    }
}
