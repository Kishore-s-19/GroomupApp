package com.groomup.backend.controller;

import com.groomup.backend.dto.PaymentRequest;
import com.groomup.backend.dto.PaymentResponse;
import com.groomup.backend.dto.RazorpayVerificationRequest;
import com.groomup.backend.model.Payment;
import com.groomup.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // -------------------------------
    // 1️⃣ CREATE PAYMENT (already working)
    // POST /api/payments
    // -------------------------------
    @PostMapping
    public PaymentResponse createPayment(@RequestBody @Valid PaymentRequest request) {
        return paymentService.createPayment(request);
    }

    // ----------------------------------------
    // 2️⃣ RAZORPAY WEBHOOK
    // POST /api/payments/webhook/razorpay
    // ----------------------------------------
    @PostMapping("/webhook/razorpay")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestHeader("X-Razorpay-Signature") String signature,
            @RequestBody String payload
    ) {
        paymentService.handleRazorpayWebhook(payload, signature);
        return ResponseEntity.ok("Webhook processed");
    }

    @PostMapping("/verify/razorpay")
    public ResponseEntity<PaymentResponse> verifyRazorpayPayment(
            @RequestBody @Valid RazorpayVerificationRequest request
    ) {
        PaymentResponse response = paymentService.verifyRazorpayPayment(request);
        return ResponseEntity.ok(response);
    }

      // STEP 8: Get latest payment for an order
    @GetMapping("/order/{orderId}/latest")
    public ResponseEntity<PaymentResponse> getLatestPaymentByOrder(
            @PathVariable Long orderId
    ) {
        Payment payment = paymentService.getLatestPaymentForOrder(orderId);

        PaymentResponse response = new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getProvider(),
                payment.getStatus().name(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getGatewayOrderId(),
                null // keyId not needed for GET
        );

        return ResponseEntity.ok(response);
   }
}