package com.groomup.backend.controller;

import com.groomup.backend.dto.ChangePasswordRequest;
import com.groomup.backend.dto.UpdateProfileRequest;
import com.groomup.backend.dto.UserResponse;
import com.groomup.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/profile")
    public UserResponse getMyProfile() {
        return profileService.getMyProfile();
    }

    @GetMapping("/users/me")
    public UserResponse getMe() {
        return profileService.getMyProfile();
    }

    @PutMapping("/users/me")
    public UserResponse updateProfile(@RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(request);
    }

    @PostMapping("/users/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        profileService.changePassword(request);
        return ResponseEntity.ok().build();
    }
}
