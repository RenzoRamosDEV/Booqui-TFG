package com.booqi.user.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Schema(description = "Datos de un usuario (respuesta)")
public record UserResponse(
        @Schema(description = "ID único del usuario", example = "1") Long id,
        @Schema(description = "Nombre del usuario", example = "Juan") String firstName,
        @Schema(description = "Apellido del usuario", example = "Pérez") String lastName,
        @Schema(description = "Fecha de nacimiento", example = "1990-05-15") LocalDate dateOfBirth,
        @Schema(description = "Número de teléfono", example = "631835827") String contactPhone,
        @Schema(description = "Correo electrónico", example = "juan.perez@email.com")
                String contactEmail,
        @Schema(
                        description = "Rol del usuario",
                        example = "CUSTOMER",
                        allowableValues = {"ADMIN", "CUSTOMER"})
                String role,
        @Schema(description = "Fecha de creación", example = "2026-01-01T10:00:00")
                LocalDateTime createdAt,
        @Schema(description = "Fecha de última actualización", example = "2026-01-01T10:00:00")
                LocalDateTime updatedAt) {}
