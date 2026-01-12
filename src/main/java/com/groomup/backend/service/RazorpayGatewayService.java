package com.groomup.backend.service;

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

@Service
public class RazorpayGatewayService {

    private final HttpClient httpClient;
    private final String baseUrl;
    private final String keyId;
    private final String keySecret;

    public RazorpayGatewayService(
            @Value("${razorpay.base-url}") String baseUrl,
            @Value("${razorpay.key-id}") String keyId,
            @Value("${razorpay.key-secret}") String keySecret
    ) {
        this.baseUrl = baseUrl;
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String getKeyId() {
        return keyId;
    }

    public String createOrder(BigDecimal amount, String currency, String receipt) {
        long amountSubunits = amount
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        String body = "{\"amount\":" + amountSubunits
                + ",\"currency\":\"" + escapeJson(currency)
                + "\",\"receipt\":\"" + escapeJson(receipt)
                + "\",\"payment_capture\":1}";

        String authHeader = buildBasicAuthHeader(keyId, keySecret);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeBaseUrl(baseUrl) + "/v1/orders"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", authHeader)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new ResponseStatusException(BAD_GATEWAY, "Razorpay order creation failed: Gateway unreachable");
        }

        if (response.statusCode() == HttpStatus.OK.value() || response.statusCode() == HttpStatus.CREATED.value()) {
            String id = extractJsonString(response.body(), "id");
            if (id == null || id.isBlank()) {
                throw new ResponseStatusException(BAD_GATEWAY, "Razorpay order creation failed: Invalid gateway response");
            }
            return id;
        }

        String description = extractGatewayErrorDescription(response.body());
        if (description == null || description.isBlank()) {
            description = "HTTP " + response.statusCode();
        }
        throw new ResponseStatusException(BAD_GATEWAY, "Razorpay order creation failed: " + description);
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

    private static String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null) {
            return "";
        }
        if (baseUrl.endsWith("/")) {
            return baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
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
