package com.booqi.user.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.swagger.v3.oas.models.OpenAPI;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class ConfigBeansTest {

    @Test
    void openApi_describeElServicioSinServidores() {
        OpenAPI openApi = new OpenApiConfig().openApi();

        assertThat(openApi.getInfo().getTitle()).isEqualTo("Booqi User Service API");
        assertThat(openApi.getInfo().getVersion()).isEqualTo("v1");
        assertThat(openApi.getServers()).isNullOrEmpty();
        assertThat(openApi.getInfo().getDescription())
                .isEqualTo("Registration, lookup, update, deletion and login of Booqi users.");
        assertThat(openApi.getInfo().getContact().getName())
                .isEqualTo("Renzo Iván Ramos de los Ríos & Melanie Gabriela Cárdenas Hidalgo");
    }

    @Test
    void passwordEncoder_esBCryptCoste10() {
        PasswordEncoder encoder = new PasswordConfig().passwordEncoder();

        String hash = encoder.encode("admin_mel");

        assertThat(hash).startsWith("$2a$10$");
        assertThat(encoder.matches("admin_mel", hash)).isTrue();
    }
}
