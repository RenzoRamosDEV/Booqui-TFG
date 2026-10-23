package com.booqi.booking.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Datos para crear una reserva")
public record CreateBookingRequest(

        @Schema(description = "ID del usuario que reserva", example = "3", required = true)
        @NotNull(message = "El ID del usuario es requerido")
        Long userId,

        @Schema(description = "ID del evento reservado", example = "2", required = true)
        @NotNull(message = "El ID del evento es requerido")
        Long eventId,

        @Schema(description = "Cantidad de entradas (mínimo 1)", example = "2", required = true)
        @NotNull(message = "La cantidad de tickets es requerida")
        @Min(value = 1, message = "La cantidad de tickets debe ser al menos 1")
        Integer ticketQuantity
) {
}
