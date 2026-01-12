package com.groomup.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.core.userdetails.UserDetailsService;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            UserDetailsService userDetailsService
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // ❌ Disable CSRF (REST API)
            .csrf(csrf -> csrf.disable())

            // ✅ Enable CORS
            .cors(Customizer.withDefaults())

            // ❌ Disable form & basic auth
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())

            // ✅ JWT = Stateless
            .sessionManagement(sess ->
                sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // 🔐 AUTHORIZATION RULES (ORDER MATTERS)
            .authorizeHttpRequests(auth -> auth

                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/error").permitAll()

                // 🔓 PUBLIC – auth endpoints
                .requestMatchers("/api/auth/**").permitAll()

                // 🔓 PUBLIC – product READ
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()

                // 🔓 PUBLIC – payment webhooks
                .requestMatchers("/api/payments/webhook/**").permitAll()

                // 🔒 USER – must be logged in (JWT)
                .requestMatchers(
                        "/api/cart/**",
                        "/api/profile/**",
                        "/api/users/me",
                        "/api/orders/**",
                        "/api/payments/**"
                ).authenticated()

                // 🔒 ADMIN – product WRITE
             // 🔒 ADMIN – product WRITE
                .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")


                // 🔒 Everything else
                .anyRequest().authenticated()
            )

            // Authentication provider
            .authenticationProvider(authenticationProvider())

            // JWT filter
            .addFilterBefore(
                    jwtAuthFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    // =========================
    // AUTH BEANS
    // =========================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
