package com.booqi.booking.controller;

import com.booqi.booking.dto.request.BookingFilter;
import com.booqi.booking.dto.request.CreateBookingRequest;
import com.booqi.booking.dto.response.BookingResponse;
import com.booqi.booking.service.BookingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@Tag(
        name = "Bookings",
        description =
                "Creation, lookup, filtering, confirmation and cancellation of Booqi bookings")
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @Operation(
            summary = "Create a booking",
            description = "Snapshots the user and the event read from their services")
    @ApiResponse(
            responseCode = "201",
            description = "Booking created; Location points to the new resource")
    @ApiResponse(responseCode = "400", description = "Validation failed or malformed body")
    @ApiResponse(responseCode = "404", description = "Remote user or event not found")
    @ApiResponse(responseCode = "422", description = "A remote service rejected the request")
    @ApiResponse(responseCode = "503", description = "User or event service unavailable")
    @PostMapping
    public ResponseEntity<BookingResponse> create(
            @Valid @RequestBody CreateBookingRequest request) {
        BookingResponse created = bookingService.create(request);
        return ResponseEntity.created(URI.create("/api/v1/bookings/" + created.id())).body(created);
    }

    @Operation(
            summary = "List bookings",
            description = "Optional filters; only one at a time, blank values are ignored")
    @ApiResponse(responseCode = "200", description = "Matching bookings (possibly empty)")
    @ApiResponse(
            responseCode = "400",
            description = "More than one filter supplied or non-numeric id")
    @GetMapping
    public ResponseEntity<List<BookingResponse>> findAll(
            @ParameterObject @ModelAttribute BookingFilter filter) {
        return ResponseEntity.ok(bookingService.findAll(filter));
    }

    @Operation(summary = "Get a booking by id")
    @ApiResponse(responseCode = "200", description = "Booking found")
    @ApiResponse(responseCode = "400", description = "Non-numeric id")
    @ApiResponse(responseCode = "404", description = "Booking not found")
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.findById(id));
    }

    @Operation(
            summary = "Confirm a booking",
            description = "Used by payment-service when a payment is approved")
    @ApiResponse(responseCode = "200", description = "Booking confirmed; returns the booking")
    @ApiResponse(responseCode = "404", description = "Booking not found")
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<BookingResponse> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.confirm(id));
    }

    @Operation(
            summary = "Cancel a booking",
            description = "Used by payment-service when a payment is rejected")
    @ApiResponse(responseCode = "200", description = "Booking cancelled; returns the booking")
    @ApiResponse(responseCode = "404", description = "Booking not found")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancel(id));
    }
}
