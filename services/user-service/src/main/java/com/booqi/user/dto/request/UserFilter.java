package com.booqi.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Filtros opcionales del listado de usuarios; solo uno a la vez (firstName y lastName combinables)")
public record UserFilter(

        @Schema(description = "Correo electrónico exacto", example = "mel@booqi.com")
        String contactEmail,

        @Schema(description = "Teléfono exacto", example = "631835827")
        String contactPhone,

        @Schema(description = "Rol (sin distinguir mayúsculas)", example = "ADMIN")
        String role,

        @Schema(description = "Nombre (sin distinguir mayúsculas)", example = "Mel")
        String firstName,

        @Schema(description = "Apellido (sin distinguir mayúsculas)", example = "Admin")
        String lastName
) {
}
