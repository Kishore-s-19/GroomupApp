package com.groomup.backend.controller;

import com.groomup.backend.dto.PaymentRequest;
import com.groomup.backend.dto.PaymentResponse;
import com.groomup.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public PaymentResponse createPayment(@RequestBody @Valid PaymentRequest request) {
        return paymentService.createPayment(request);
    }

    @PostMapping("/retry")
    public PaymentResponse retryPayment(@RequestBody @Valid PaymentRequest request) {
        return paymentService.retryPayment(request);
    }
}
