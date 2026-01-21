package com.groomup.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    private static final int MIN_KEY_LENGTH_BYTES = 32;

    @Value("${jwt.secret:CHANGE_THIS_IN_PRODUCTION_USE_SECURE_256_BIT_KEY_MUST_BE_32_CHARS}")
    private String secretKey;

    @Value("${jwt.expiration:3600000}")
    private long jwtExpiration;

    private SecretKey cachedKey;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", userDetails.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .orElse("USER"));
        return generateToken(extraClaims, userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String email = extractUsername(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        if (cachedKey != null) {
            return cachedKey;
        }

        if (secretKey == null || secretKey.trim().isEmpty()) {
            logger.error("JWT secret is not configured");
            throw new IllegalStateException("JWT secret is not configured");
        }

        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        logger.debug("JWT secret used as plain text (UTF-8)");

        if (keyBytes.length < MIN_KEY_LENGTH_BYTES) {
            logger.error("JWT secret key is too short. Minimum {} bytes required, got {} bytes",
                    MIN_KEY_LENGTH_BYTES, keyBytes.length);
            throw new IllegalStateException(
                    "JWT secret key must be at least " + MIN_KEY_LENGTH_BYTES + " bytes (256 bits) for HS256");
        }

        cachedKey = Keys.hmacShaKeyFor(keyBytes);
        logger.info("JWT signing key initialized successfully");
        return cachedKey;
    }
}
