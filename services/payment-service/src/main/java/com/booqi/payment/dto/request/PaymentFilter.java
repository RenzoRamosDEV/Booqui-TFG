package com.booqi.payment.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Filtros opcionales del listado de pagos; solo uno a la vez")
public record PaymentFilter(

        @Schema(description = "ID del usuario", example = "3")
        Long userId,

        @Schema(description = "ID del evento", example = "2")
        Long eventId,

        @Schema(description = "ID de la reserva", example = "1")
        Long bookingId,

        @Schema(description = "Estado exacto", example = "APPROVED")
        String status
) {
}
