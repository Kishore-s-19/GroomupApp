package com.groomup.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class RazorpayGatewayService {

    private final RestTemplate restTemplate;

    @Value("${razorpay.base-url:https://api.razorpay.com}")
    private String baseUrl;

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    public RazorpayGatewayService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String getKeyId() {
        return keyId;
    }

    public String createOrder(BigDecimal amount, String currency, String receipt) {
        ensureConfigured();

        long amountSubunits = toSubunits(amount);
        String normalizedCurrency = currency == null ? "INR" : currency.trim().toUpperCase(Locale.ROOT);

        String url = baseUrl + "/v1/orders";

        Map<String, Object> body = new HashMap<>();
        body.put("amount", amountSubunits);
        body.put("currency", normalizedCurrency);
        body.put("receipt", receipt);
        body.put("payment_capture", 1);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + basicAuthToken(keyId, keySecret));

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            Map<?, ?> payload = response.getBody();
            if (payload == null || payload.get("id") == null) {
                throw new ResponseStatusException(BAD_GATEWAY, "Invalid Razorpay response");
            }
            return payload.get("id").toString();
        } catch (RestClientResponseException ex) {
            throw new ResponseStatusException(
                    BAD_GATEWAY,
                    "Razorpay order creation failed: " + ex.getStatusText()
            );
        }
    }

    private void ensureConfigured() {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Razorpay keys are not configured");
        }
    }

    private long toSubunits(BigDecimal amount) {
        if (amount == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Amount is required");
        }
        try {
            return amount.multiply(new BigDecimal("100")).longValueExact();
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Amount must have max 2 decimals");
        }
    }

    private String basicAuthToken(String username, String password) {
        String raw = username + ":" + password;
        byte[] encoded = Base64.getEncoder().encode(raw.getBytes(StandardCharsets.UTF_8));
        return new String(encoded, StandardCharsets.UTF_8);
    }
}

