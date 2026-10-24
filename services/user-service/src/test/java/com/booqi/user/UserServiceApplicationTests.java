package com.booqi.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserServiceApplicationTests {

    private final MockMvc mockMvc;
    private final ApplicationContext context;

    UserServiceApplicationTests(MockMvc mockMvc, ApplicationContext context) {
        this.mockMvc = mockMvc;
        this.context = context;
    }

    @Test
    void contextLoads_conBeanOpenApi() {
        assertThat(context.containsBean("openApi")).isTrue();
    }

    @Test
    void actuatorHealth_estaUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void actuatorProbes_disponibles() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
        mockMvc.perform(get("/actuator/health/readiness")).andExpect(status().isOk());
    }

    @Test
    void actuatorEnv_noExpuesto() throws Exception {
        mockMvc.perform(get("/actuator/env")).andExpect(status().isNotFound());
    }

    @Test
    void apiDocs_describeLaApiV1SinServidorFijo() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Booqi User Service API"))
                .andExpect(jsonPath("$.info.version").value("v1"))
                .andExpect(jsonPath("$.paths['/api/v1/users']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/{id}']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/login']").exists())
                .andExpect(jsonPath("$.servers[*].url", not(hasItem("http://localhost:8080"))));
    }

    @Test
    void rutaLegada_retorna404() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isNotFound());
    }
}
