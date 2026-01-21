package com.groomup.backend.service;

import com.groomup.backend.dto.AuthenticationRequest;
import com.groomup.backend.dto.AuthenticationResponse;
import com.groomup.backend.dto.RegisterRequest;
import com.groomup.backend.model.Role;
import com.groomup.backend.model.User;
import com.groomup.backend.repository.UserRepository;
import com.groomup.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.*;

@Service
public class AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    // =========================
    // REGISTER
    // =========================
    public AuthenticationResponse register(RegisterRequest request) {

        // Default role = USER
        Role role;
        try {
            role = request.getRole() != null
                    ? Role.valueOf(request.getRole())
                    : Role.USER;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid role");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(CONFLICT, "Email already registered");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ResponseStatusException(CONFLICT, "Phone already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRole(role.name());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);

        return new AuthenticationResponse(jwtToken);
    }

    // =========================
    // LOGIN
    // =========================
    public AuthenticationResponse login(AuthenticationRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            logger.warn("Authentication failed for user: {}", request.getEmail());
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        String jwtToken = jwtService.generateToken(user);

        return new AuthenticationResponse(jwtToken);
    }
}
