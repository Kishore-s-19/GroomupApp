package com.groomup.backend.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class RazorpayGatewayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayGatewayService.class);

    private final HttpClient httpClient;
    private final String keyId;
    private final String keySecret;
    private final String baseUrl;

    @Value("${app.environment:development}")
    private String environment;

    public RazorpayGatewayService(
            @Value("${razorpay.key-id:}") String keyId,
            @Value("${razorpay.key-secret:}") String keySecret,
            @Value("${razorpay.base-url:https://api.razorpay.com}") String baseUrl
    ) {
        this.keyId = sanitizeKey(keyId);
        this.keySecret = sanitizeKey(keySecret);
        this.baseUrl = (baseUrl == null || baseUrl.isBlank()) ? "https://api.razorpay.com" : baseUrl.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @PostConstruct
    public void validateConfiguration() {
        if (keyId == null || keyId.isBlank()) {
            log.warn("Razorpay Key ID not configured. Payments will fail.");
        } else {
            String mode = keyId.startsWith("rzp_test_") ? "TEST" : (keyId.startsWith("rzp_live_") ? "LIVE" : "UNKNOWN");
            log.info("Razorpay Mode: {}", mode);
            log.info("Razorpay Key ID: {}...{} (length: {})", 
                keyId.substring(0, Math.min(8, keyId.length())),
                keyId.substring(Math.max(0, keyId.length() - 4)),
                keyId.length());
            
            // Check for potential hidden characters that trim() might miss or that user might have pasted
            for (char c : keyId.toCharArray()) {
                if (c < 33 || c > 126) {
                    log.error("CRITICAL: Key ID contains hidden character at code: {}", (int)c);
                }
            }
        }

        if (keySecret == null || keySecret.isBlank()) {
            log.warn("Razorpay Key Secret not configured. Payments will fail.");
        } else {
            log.info("Razorpay Key Secret: {}...{} (length: {})", 
                keySecret.substring(0, Math.min(3, keySecret.length())),
                keySecret.substring(Math.max(0, keySecret.length() - 3)),
                keySecret.length());

            for (char c : keySecret.toCharArray()) {
                if (c < 33 || c > 126) {
                    log.error("CRITICAL: Key Secret contains hidden character at code: {}", (int)c);
                }
            }
        }

        if ("production".equalsIgnoreCase(environment) && keyId != null && keyId.startsWith("rzp_test_")) {
            log.error("WARNING: Using TEST Razorpay keys in PRODUCTION environment!");
        }
    }

    public String getKeyId() {
        return keyId;
    }

    public boolean isLiveMode() {
        return keyId != null && keyId.startsWith("rzp_live_");
    }

    public boolean isConfigured() {
        return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
    }

    public String createOrder(BigDecimal amount, String currency, String receipt) {
        if (!isConfigured()) {
            log.error("Razorpay not configured. Cannot create order.");
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Payment gateway not configured");
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment amount");
        }

        long amountSubunits = amount
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        if (amountSubunits < 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum payment amount is Rs. 1");
        }

        String sanitizedReceipt = escapeJson(receipt != null ? receipt.substring(0, Math.min(40, receipt.length())) : "order");
        String sanitizedCurrency = escapeJson(currency != null ? currency.toUpperCase() : "INR");

        String body = "{\"amount\":" + amountSubunits
                + ",\"currency\":\"" + sanitizedCurrency
                + "\",\"receipt\":\"" + sanitizedReceipt
                + "\"}";

        String authHeader = buildBasicAuthHeader(keyId, keySecret);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/v1/orders"))
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", authHeader)
                .header("Content-Type", "application/json")
                .header("User-Agent", "Groomup-Backend/1.0")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response;
        try {
            log.debug("Creating Razorpay order: amount={}, currency={}", amountSubunits, sanitizedCurrency);
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (java.net.http.HttpTimeoutException e) {
            log.error("Razorpay request timed out", e);
            throw new ResponseStatusException(BAD_GATEWAY, "Payment gateway timeout. Please try again.");
        } catch (Exception e) {
            log.error("Razorpay request failed", e);
            throw new ResponseStatusException(BAD_GATEWAY, "Payment gateway unreachable. Please try again later.");
        }

        if (response.statusCode() == HttpStatus.OK.value() || response.statusCode() == HttpStatus.CREATED.value()) {
            String id = extractJsonString(response.body(), "id");
            if (id == null || id.isBlank()) {
                log.error("Razorpay returned success but no order ID: {}", response.body());
                throw new ResponseStatusException(BAD_GATEWAY, "Invalid response from payment gateway");
            }
            log.info("Razorpay order created: {}", id);
            return id;
        }

        String description = extractGatewayErrorDescription(response.body());
        if (description == null || description.isBlank()) {
            description = "HTTP " + response.statusCode();
        }
        
        log.error("Razorpay order creation failed: {} - {} - body={}", response.statusCode(), description, response.body());

        if (response.statusCode() == 401) {
            throw new ResponseStatusException(BAD_GATEWAY, "Payment gateway authentication failed");
        } else if (response.statusCode() == 400) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment request: " + description);
        }

        
        throw new ResponseStatusException(BAD_GATEWAY, "Payment gateway error: " + description);
    }

    private static String buildBasicAuthHeader(String keyId, String keySecret) {
        String raw = (keyId == null ? "" : keyId) + ":" + (keySecret == null ? "" : keySecret);
        String encoded = Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
        return "Basic " + encoded;
    }

    private String extractGatewayErrorDescription(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return null;
        }
        String description = extractJsonString(responseBody, "description");
        if (description != null && !description.isBlank()) {
            return description;
        }
        String code = extractJsonString(responseBody, "code");
        if (code != null && !code.isBlank()) {
            return code;
        }
        return null;
    }

    private static String sanitizeKey(String value) {
        if (value == null) {
            return "";
        }
        String sanitized = value.trim();
        if ((sanitized.startsWith("\"") && sanitized.endsWith("\""))
                || (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
            sanitized = sanitized.substring(1, sanitized.length() - 1).trim();
        }
        return sanitized.replaceAll("\\s+", "");
    }

    private static String extractJsonString(String json, String key) {
        if (json == null || json.isBlank() || key == null || key.isBlank()) {
            return null;
        }
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    private static String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
