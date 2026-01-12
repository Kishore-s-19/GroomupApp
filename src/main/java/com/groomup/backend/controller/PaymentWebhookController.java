package com.groomup.backend.controller;

import com.groomup.backend.dto.WebhookResponse;
import com.groomup.backend.service.RazorpayWebhookService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/webhook")
public class PaymentWebhookController {

    private final RazorpayWebhookService razorpayWebhookService;

    public PaymentWebhookController(RazorpayWebhookService razorpayWebhookService) {
        this.razorpayWebhookService = razorpayWebhookService;
    }

    @PostMapping("/razorpay")
    public WebhookResponse handleRazorpay(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody String body
    ) {
        return razorpayWebhookService.handle(body, signature);
    }
}

