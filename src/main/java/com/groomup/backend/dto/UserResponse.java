package com.groomup.backend.dto;

import java.time.LocalDateTime;

public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private LocalDateTime createdAt;

    public UserResponse(
            Long id,
            String name,
            String email,
            String phone,
            String role,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getRole() { return role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
