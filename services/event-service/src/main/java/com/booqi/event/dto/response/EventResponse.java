package com.booqi.event.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Datos de un evento (respuesta)")
public record EventResponse(
        @Schema(description = "ID único del evento", example = "1") Long id,
        @Schema(description = "Título del evento", example = "Festival de Música Indie 2026")
                String title,
        @Schema(
                        description = "Descripción detallada del evento",
                        example = "Un festival increíble con las mejores bandas indie del momento")
                String description,
        @Schema(description = "Número de entradas disponibles", example = "500")
                Integer availableTickets,
        @Schema(
                        description = "Ubicación del evento",
                        example = "Auditorio Nacional, Ciudad de México")
                String location,
        @Schema(description = "Fecha y hora de inicio", example = "2026-06-15T20:00:00")
                LocalDateTime startDate,
        @Schema(description = "Fecha y hora de fin", example = "2026-06-15T23:59:59")
                LocalDateTime endDate,
        @Schema(
                        description = "Nombre del organizador del evento",
                        example = "Rock Productions S.A.")
                String organizer,
        @Schema(description = "Precio de la entrada en euros", example = "45.50") Double price,
        @Schema(description = "Categoría del evento", example = "Música") String category,
        @Schema(description = "Email de contacto del evento", example = "info@festivalmadrid.com")
                String contactEmail,
        @Schema(description = "Teléfono de contacto", example = "910123456") String contactPhone,
        @Schema(
                        description = "URL de la imagen promocional",
                        example = "https://example.com/imagen-evento.jpg")
                String imageUrl,
        @Schema(description = "Fecha de creación", example = "2026-01-01T10:00:00")
                LocalDateTime createdAt,
        @Schema(description = "Fecha de última modificación", example = "2026-01-02T11:30:00")
                LocalDateTime updatedAt) {}
