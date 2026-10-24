package com.booqi.payment.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.swagger.v3.oas.models.OpenAPI;

import org.junit.jupiter.api.Test;

class ConfigBeansTest {

    @Test
    void openApi_describeElServicioSinServidores() {
        OpenAPI openApi = new OpenApiConfig().openApi();

        assertThat(openApi.getInfo().getTitle()).isEqualTo("Booqi Payment Service API");
        assertThat(openApi.getInfo().getVersion()).isEqualTo("v1");
        assertThat(openApi.getInfo().getDescription())
                .isEqualTo("Simulated processing and lookup of Booqi payments.");
        assertThat(openApi.getServers()).isNullOrEmpty();
        assertThat(openApi.getInfo().getDescription())
                .isEqualTo("Simulated processing and lookup of Booqi payments.");
        assertThat(openApi.getInfo().getContact().getName())
                .isEqualTo("Renzo Iván Ramos de los Ríos & Melanie Gabriela Cárdenas Hidalgo");
    }
}
