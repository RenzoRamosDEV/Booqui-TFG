package com.booqi.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Datos para actualizar un usuario (todos los campos opcionales)")
public record UpdateUserRequest(

        @Schema(description = "Nombre del usuario", example = "Carlos")
        @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
        String firstName,

        @Schema(description = "Apellido del usuario", example = "García")
        @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
        String lastName,

        @Schema(description = "Fecha de nacimiento (formato: YYYY-MM-DD)", example = "1990-05-15")
        @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
        LocalDate dateOfBirth,

        @Schema(description = "Número de teléfono (10-15 dígitos)", example = "+34912345678")
        @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "El teléfono debe tener entre 10 y 15 dígitos")
        String contactPhone,

        @Schema(description = "Correo electrónico del usuario", example = "carlos.garcia@example.com")
        @Email(message = "El correo electrónico debe ser válido")
        String contactEmail,

        @Schema(description = "Contraseña del usuario (mínimo 8 caracteres)", example = "MySecurePassword123!")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        String password,

        @Schema(description = "Rol del usuario", example = "CUSTOMER", allowableValues = {"ADMIN", "CUSTOMER"})
        @Pattern(regexp = "ADMIN|CUSTOMER", message = "El rol debe ser ADMIN o CUSTOMER")
        String role
) {

    @Override
    public String toString() {
        return "UpdateUserRequest[firstName=" + firstName
                + ", lastName=" + lastName
                + ", dateOfBirth=" + dateOfBirth
                + ", contactPhone=" + contactPhone
                + ", contactEmail=" + contactEmail
                + ", password=***"
                + ", role=" + role + "]";
    }
}
