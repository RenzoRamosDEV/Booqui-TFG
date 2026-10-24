package com.booqi.payment.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

@Schema(description = "Datos para crear un pago")
public record CreatePaymentRequest(
        @Schema(description = "ID de la reserva a pagar", example = "1", required = true)
                @NotNull(message = "El ID de la reserva es requerido")
                Long bookingId,
        @Schema(description = "ID del usuario", example = "1", required = true)
                @NotNull(message = "El ID del usuario es requerido")
                Long userId,
        @Schema(description = "ID del evento", example = "1", required = true)
                @NotNull(message = "El ID del evento es requerido")
                Long eventId,
        @Schema(description = "Cantidad de tickets", example = "2", required = true)
                @NotNull(message = "La cantidad de tickets es requerida")
                @Min(value = 1, message = "La cantidad de tickets debe ser al menos 1")
                Integer ticketQuantity,
        @Schema(description = "Precio total a pagar", example = "100.00", required = true)
                @NotNull(message = "El precio total es requerido")
                @Min(value = 0, message = "El precio total debe ser mayor o igual a 0")
                BigDecimal totalPrice,
        @Schema(
                        description = "Método de pago",
                        example = "CREDIT_CARD",
                        required = true,
                        allowableValues = {"CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER"})
                @NotNull(message = "El método de pago es requerido")
                @Pattern(
                        regexp = "CREDIT_CARD|DEBIT_CARD|PAYPAL|BANK_TRANSFER",
                        message = "Método de pago inválido")
                String paymentMethod,
        @Schema(description = "Número de tarjeta (solo simulación)", example = "4111111111111111")
                String cardNumber,
        @Schema(description = "CVV de la tarjeta (solo simulación)", example = "123") String cvv) {

    @Override
    public String toString() {
        return "CreatePaymentRequest[bookingId="
                + bookingId
                + ", userId="
                + userId
                + ", eventId="
                + eventId
                + ", ticketQuantity="
                + ticketQuantity
                + ", totalPrice="
                + totalPrice
                + ", paymentMethod="
                + paymentMethod
                + ", cardNumber=***"
                + ", cvv=***]";
    }
}
