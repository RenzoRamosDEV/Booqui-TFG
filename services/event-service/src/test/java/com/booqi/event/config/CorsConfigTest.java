package com.booqi.event.config;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.booqi.event.controller.EventController;
import com.booqi.event.service.EventService;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(EventController.class)
@ActiveProfiles("test")
class CorsConfigTest {

    private final MockMvc mockMvc;

    @MockitoBean private EventService eventService;

    CorsConfigTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
    }

    @Test
    void preflight_desdeOrigenPermitido_loAutoriza() throws Exception {
        mockMvc.perform(
                        options("/api/v1/events")
                                .header("Origin", "http://localhost:5173")
                                .header("Access-Control-Request-Method", "PATCH")
                                .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("PATCH")))
                .andExpect(
                        header().string(
                                        "Access-Control-Allow-Headers",
                                        containsString("Content-Type")));
    }

    @Test
    void preflight_conCabeceraNoListada_esRechazado() throws Exception {
        mockMvc.perform(
                        options("/api/v1/events")
                                .header("Origin", "http://localhost:5173")
                                .header("Access-Control-Request-Method", "POST")
                                .header("Access-Control-Request-Headers", "X-Custom"))
                .andExpect(status().isForbidden());
    }

    @Test
    void preflight_desdeOrigenNoListado_retorna403SinAllowOrigin() throws Exception {
        mockMvc.perform(
                        options("/api/v1/events")
                                .header("Origin", "http://evil.example")
                                .header("Access-Control-Request-Method", "PATCH"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
