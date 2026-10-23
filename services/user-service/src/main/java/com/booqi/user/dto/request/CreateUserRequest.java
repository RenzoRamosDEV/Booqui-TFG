package com.booqi.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Schema(description = "Datos para crear un nuevo usuario")
public record CreateUserRequest(

        @Schema(description = "Nombre del usuario", example = "Juan", required = true)
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
        String firstName,

        @Schema(description = "Apellido del usuario", example = "Pérez", required = true)
        @NotBlank(message = "El apellido es obligatorio")
        @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
        String lastName,

        @Schema(description = "Fecha de nacimiento (formato: YYYY-MM-DD)", example = "1990-05-15", required = true)
        @NotNull(message = "La fecha de nacimiento es obligatoria")
        @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
        LocalDate dateOfBirth,

        @Schema(description = "Número de teléfono (9-15 dígitos)", example = "631835827")
        @Pattern(regexp = "^\\+?[0-9]{9,15}$",
                message = "El teléfono debe tener entre 9 y 15 dígitos")
        String contactPhone,

        @Schema(description = "Correo electrónico único", example = "juan.perez@email.com", required = true)
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email debe ser válido")
        String contactEmail,

        @Schema(description = "Contraseña (mínimo 8 caracteres)", example = "securepass123", required = true)
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        String password,

        @Schema(description = "Rol del usuario", example = "CUSTOMER", allowableValues = {"ADMIN", "CUSTOMER"})
        @Pattern(regexp = "ADMIN|CUSTOMER", message = "El rol debe ser ADMIN o CUSTOMER")
        String role
) {

    @Override
    public String toString() {
        return "CreateUserRequest[firstName=" + firstName
                + ", lastName=" + lastName
                + ", dateOfBirth=" + dateOfBirth
                + ", contactPhone=" + contactPhone
                + ", contactEmail=" + contactEmail
                + ", password=***"
                + ", role=" + role + "]";
    }
}
