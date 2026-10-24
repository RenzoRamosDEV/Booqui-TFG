package com.booqi.payment.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "Datos de respuesta del pago")
public record PaymentResponse(
        @Schema(description = "ID único del pago", example = "1") Long id,
        @Schema(description = "ID de la reserva asociada", example = "1") Long bookingId,
        @Schema(description = "ID del usuario", example = "1") Long userId,
        @Schema(description = "ID del evento", example = "1") Long eventId,
        @Schema(description = "Cantidad de tickets", example = "2") Integer ticketQuantity,
        @Schema(description = "Precio total pagado", example = "100.00") BigDecimal totalPrice,
        @Schema(description = "Método de pago utilizado", example = "CREDIT_CARD")
                String paymentMethod,
        @Schema(description = "Estado del pago", example = "APPROVED") String status,
        @Schema(description = "ID de transacción", example = "TXN-20260221-123456")
                String transactionId,
        @Schema(description = "Mensaje de error (si el pago falló)", example = "null")
                String errorMessage,
        @Schema(description = "Fecha y hora del pago", example = "2026-02-21T14:30:00")
                @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
                LocalDateTime paymentDate,
        @Schema(
                        description = "Fecha y hora de creación del registro",
                        example = "2026-02-21T14:30:00")
                @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
                LocalDateTime createdAt,
        @Schema(
                        description = "Fecha y hora de última modificación",
                        example = "2026-02-21T14:30:01")
                @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
                LocalDateTime updatedAt) {}
