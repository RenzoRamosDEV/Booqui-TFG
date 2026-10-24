package com.booqi.booking.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ConfigBeansTest {

    @Test
    void openApi_describeElServicioSinServidores() {
        OpenAPI openApi = new OpenApiConfig().openApi();

        assertThat(openApi.getInfo().getTitle()).isEqualTo("Booqi Booking Service API");
        assertThat(openApi.getInfo().getVersion()).isEqualTo("v1");
        assertThat(openApi.getInfo().getDescription()).isEqualTo(
                "Creation, lookup, filtering, confirmation and cancellation of Booqi bookings.");
        assertThat(openApi.getServers()).isNullOrEmpty();
        assertThat(openApi.getInfo().getDescription()).isEqualTo("Creation, lookup, filtering, confirmation and cancellation of Booqi bookings.");
        assertThat(openApi.getInfo().getContact().getName()).isEqualTo("Renzo Iván Ramos de los Ríos & Melanie Gabriela Cárdenas Hidalgo");
    }
}
