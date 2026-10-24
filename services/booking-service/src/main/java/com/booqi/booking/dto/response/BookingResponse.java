package com.booqi.booking.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "Datos de una reserva (respuesta)")
public record BookingResponse(
        @Schema(description = "ID único de la reserva", example = "1") Long id,
        @Schema(description = "ID del usuario", example = "3") Long userId,
        @Schema(description = "Nombre del usuario en el momento de la reserva", example = "Ana")
                String userFirstName,
        @Schema(
                        description = "Apellidos del usuario en el momento de la reserva",
                        example = "López")
                String userLastName,
        @Schema(
                        description = "Email del usuario en el momento de la reserva",
                        example = "ana@booqi.com")
                String userEmail,
        @Schema(description = "ID del evento", example = "2") Long eventId,
        @Schema(description = "Título del evento", example = "Clases de Baile de Salón")
                String eventTitle,
        @Schema(description = "Descripción del evento") String eventDescription,
        @Schema(description = "Fecha y hora de inicio del evento", example = "2026-06-15T20:00:00")
                @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
                LocalDateTime eventStartDate,
        @Schema(description = "Ubicación del evento", example = "Madrid") String eventLocation,
        @Schema(description = "Cantidad de entradas", example = "2") Integer ticketQuantity,
        @Schema(description = "Precio unitario", example = "35.00") BigDecimal basePrice,
        @Schema(description = "Precio total", example = "70.00") BigDecimal totalPrice,
        @Schema(description = "Estado de la reserva", example = "PENDING") String status,
        @Schema(description = "Fecha de creación", example = "2026-01-01T10:00:00")
                @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
                LocalDateTime createdAt,
        @Schema(description = "Fecha de última modificación", example = "2026-01-02T11:30:00")
                @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
                LocalDateTime updatedAt) {}
