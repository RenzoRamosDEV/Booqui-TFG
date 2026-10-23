package com.booqi.booking.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Filtros opcionales del listado de reservas; solo uno a la vez")
public record BookingFilter(

        @Schema(description = "ID del usuario", example = "3")
        Long userId,

        @Schema(description = "ID del evento", example = "2")
        Long eventId,

        @Schema(description = "Estado exacto", example = "PENDING")
        String status
) {
}
