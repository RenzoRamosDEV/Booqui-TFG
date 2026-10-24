package com.booqi.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Datos para realizar login")
public record LoginRequest(
        @Schema(
                        description = "Correo electrónico del usuario",
                        example = "mel@booqi.com",
                        required = true)
                @NotBlank(message = "El email es obligatorio")
                @Email(message = "El email debe ser válido")
                String contactEmail,
        @Schema(description = "Contraseña del usuario", example = "password123", required = true)
                @NotBlank(message = "La contraseña es obligatoria")
                String password) {

    @Override
    public String toString() {
        return "LoginRequest[contactEmail=" + contactEmail + ", password=***]";
    }
}
