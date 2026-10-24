package com.booqi.payment.controller;

import com.booqi.payment.dto.request.CreatePaymentRequest;
import com.booqi.payment.dto.request.PaymentFilter;
import com.booqi.payment.dto.response.PaymentResponse;
import com.booqi.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@Slf4j
@Tag(name = "Payments", description = "Simulated processing and lookup of Booqi payments")
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Process a payment",
            description = "Simulates the charge; on approval decrements event stock and confirms the booking, "
                    + "otherwise stores a REJECTED payment and cancels the booking")
    @ApiResponse(responseCode = "201", description = "Payment processed (APPROVED or REJECTED); Location points to it")
    @ApiResponse(responseCode = "400", description = "Validation failed or malformed body")
    @ApiResponse(responseCode = "422", description = "Total price exceeds the supported maximum")
    @PostMapping
    public ResponseEntity<PaymentResponse> create(@Valid @RequestBody CreatePaymentRequest request) {
        log.info("Processing payment for booking {}", request.bookingId());
        PaymentResponse created = paymentService.process(request);
        log.info("Payment {} processed with status {}", created.id(), created.status());
        return ResponseEntity.created(URI.create("/api/v1/payments/" + created.id())).body(created);
    }

    @Operation(summary = "List payments", description = "Optional filters; only one at a time, blank values are ignored")
    @ApiResponse(responseCode = "200", description = "Matching payments (possibly empty)")
    @ApiResponse(responseCode = "400", description = "More than one filter supplied or non-numeric id")
    @GetMapping
    public ResponseEntity<List<PaymentResponse>> findAll(@ParameterObject @ModelAttribute PaymentFilter filter) {
        return ResponseEntity.ok(paymentService.findAll(filter));
    }

    @Operation(summary = "Get a payment by id")
    @ApiResponse(responseCode = "200", description = "Payment found")
    @ApiResponse(responseCode = "400", description = "Non-numeric id")
    @ApiResponse(responseCode = "404", description = "Payment not found")
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.findById(id));
    }
}
