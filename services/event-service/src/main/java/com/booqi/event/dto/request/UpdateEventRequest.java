package com.booqi.event.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Schema(description = "Datos para actualizar un evento (todos los campos opcionales)")
public record UpdateEventRequest(
        @Schema(description = "Título del evento", example = "Festival de Música Indie 2026")
                @Size(min = 3, max = 200, message = "El título debe tener entre 3 y 200 caracteres")
                String title,
        @Schema(
                        description = "Descripción detallada del evento",
                        example = "Un festival increíble con las mejores bandas indie del momento")
                @Size(max = 2000, message = "La descripción no puede exceder 2000 caracteres")
                String description,
        @Schema(description = "Número de entradas disponibles", example = "450")
                @Min(value = 0, message = "El número de tickets no puede ser negativo")
                Integer availableTickets,
        @Schema(
                        description = "Ubicación del evento",
                        example = "Auditorio Nacional, Ciudad de México")
                @Size(
                        min = 3,
                        max = 200,
                        message = "La ubicación debe tener entre 3 y 200 caracteres")
                String location,
        @Schema(
                        description = "Fecha y hora de inicio (formato: YYYY-MM-DDTHH:MM:SS)",
                        example = "2026-06-15T20:00:00")
                LocalDateTime startDate,
        @Schema(
                        description = "Fecha y hora de fin (formato: YYYY-MM-DDTHH:MM:SS)",
                        example = "2026-06-15T23:59:59")
                LocalDateTime endDate,
        @Schema(
                        description = "Nombre del organizador del evento",
                        example = "Rock Productions S.A.")
                @Size(
                        min = 3,
                        max = 100,
                        message = "El organizador debe tener entre 3 y 100 caracteres")
                String organizer,
        @Schema(description = "Precio de la entrada en euros", example = "50.00")
                @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
                Double price,
        @Schema(description = "Categoría del evento", example = "Música")
                @Size(
                        min = 3,
                        max = 50,
                        message = "La categoría debe tener entre 3 y 50 caracteres")
                String category,
        @Schema(description = "Email de contacto del evento", example = "info@festivalmadrid.com")
                @Email(message = "El email de contacto debe ser válido")
                String contactEmail,
        @Schema(description = "Teléfono de contacto (10-15 dígitos)", example = "910123456")
                @Pattern(
                        regexp = "^\\+?[0-9]{9,15}$",
                        message = "El teléfono debe tener entre 10 y 15 dígitos")
                String contactPhone,
        @Schema(
                        description = "URL de la imagen promocional del evento",
                        example = "https://example.com/imagen-evento.jpg")
                String imageUrl) {}
