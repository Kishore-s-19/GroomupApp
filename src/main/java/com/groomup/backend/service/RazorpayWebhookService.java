package com.groomup.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.groomup.backend.dto.WebhookResponse;
import com.groomup.backend.model.Order;
import com.groomup.backend.model.Payment;
import com.groomup.backend.model.PaymentStatus;
import com.groomup.backend.repository.OrderRepository;
import com.groomup.backend.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class RazorpayWebhookService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    public RazorpayWebhookService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            ObjectMapper objectMapper
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public WebhookResponse handle(String rawBody, String signatureHeader) {
        if (!isValidSignature(rawBody, signatureHeader)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook signature");
        }

        JsonNode root = readJson(rawBody);
        String event = root.path("event").asText(null);
        JsonNode entity = root.path("payload").path("payment").path("entity");

        String gatewayOrderId = entity.path("order_id").asText(null);
        String gatewayPaymentId = entity.path("id").asText(null);

        if (gatewayOrderId == null || gatewayOrderId.isBlank()) {
            return new WebhookResponse(false, "missing_order_id");
        }

        Payment payment = paymentRepository.findByGatewayOrderId(gatewayOrderId).orElse(null);
        if (payment == null) {
            return new WebhookResponse(false, "unknown_gateway_order_id");
        }

        if (gatewayPaymentId != null && !gatewayPaymentId.isBlank()) {
            if (payment.getGatewayPaymentId() == null || payment.getGatewayPaymentId().isBlank()) {
                payment.setGatewayPaymentId(gatewayPaymentId);
            }
        }
        payment.setGatewaySignature(signatureHeader);

        if (!amountMatches(payment, entity)) {
            return new WebhookResponse(false, "amount_mismatch");
        }

        if ("payment.captured".equals(event)) {
            if (payment.getStatus() != PaymentStatus.SUCCESS) {
                payment.setStatus(PaymentStatus.SUCCESS);
            }
            syncOrderStatus(payment, "PAID");
            paymentRepository.save(payment);
            return new WebhookResponse(true, "payment_captured");
        }

        if ("payment.failed".equals(event)) {
            if (payment.getStatus() != PaymentStatus.SUCCESS) {
                payment.setStatus(PaymentStatus.FAILED);
                String failureReason = entity.path("error_description").asText(null);
                if (failureReason == null || failureReason.isBlank()) {
                    failureReason = entity.path("error_reason").asText(null);
                }
                payment.setFailureReason(failureReason);
            }
            syncOrderStatus(payment, "FAILED");
            paymentRepository.save(payment);
            return new WebhookResponse(true, "payment_failed");
        }

        return new WebhookResponse(false, "ignored_event");
    }

    private void syncOrderStatus(Payment payment, String newStatus) {
        Order order = payment.getOrder();
        if (order == null) {
            return;
        }
        String current = order.getStatus();
        if ("DELIVERED".equals(current) || "CANCELLED".equals(current)) {
            return;
        }
        if (newStatus.equals(current)) {
            return;
        }
        order.setStatus(newStatus);
        orderRepository.save(order);
    }

    public boolean isValidSignature(String rawBody, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        if (webhookSecret == null || webhookSecret.isBlank()) {
            return false;
        }
        String expected = hmacSha256Hex(rawBody, webhookSecret);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signatureHeader.trim().getBytes(StandardCharsets.UTF_8)
        );
    }

    private JsonNode readJson(String rawBody) {
        try {
            return objectMapper.readTree(rawBody);
        } catch (Exception ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid webhook payload");
        }
    }

    private boolean amountMatches(Payment payment, JsonNode entity) {
        if (payment.getAmount() == null) {
            return false;
        }
        long gatewayAmount = entity.path("amount").asLong(-1L);
        if (gatewayAmount < 0) {
            return false;
        }
        long expectedAmount = toSubunits(payment.getAmount());
        return expectedAmount == gatewayAmount;
    }

    private long toSubunits(BigDecimal amount) {
        return amount.multiply(new BigDecimal("100")).longValue();
    }

    private String hmacSha256Hex(String payload, String secret) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return toHex(hash);
        } catch (Exception ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Signature verification failed");
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(Character.forDigit((b >> 4) & 0xF, 16));
            sb.append(Character.forDigit(b & 0xF, 16));
        }
        return sb.toString();
    }
}
