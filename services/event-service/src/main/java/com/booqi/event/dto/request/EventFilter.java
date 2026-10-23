package com.booqi.event.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Filtros opcionales del listado de eventos; solo uno a la vez")
public record EventFilter(

        @Schema(description = "Email de contacto exacto", example = "contacto@foodtruckfest.com")
        String contactEmail,

        @Schema(description = "Título (contiene, sin distinguir mayúsculas)", example = "jazz")
        String title,

        @Schema(description = "Categoría (sin distinguir mayúsculas)", example = "Música")
        String category,

        @Schema(description = "Ubicación (contiene, sin distinguir mayúsculas)", example = "Madrid")
        String location,

        @Schema(description = "Organizador (contiene, sin distinguir mayúsculas)", example = "foodies")
        String organizer
) {
}
