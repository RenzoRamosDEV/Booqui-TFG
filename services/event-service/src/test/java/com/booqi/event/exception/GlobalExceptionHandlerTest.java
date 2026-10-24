package com.booqi.event.exception;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

class GlobalExceptionHandlerTest {

    private static final MediaType PROBLEM = MediaType.APPLICATION_PROBLEM_JSON;

    private final MockMvc mockMvc =
            MockMvcBuilders.standaloneSetup(new ProbeController())
                    .setControllerAdvice(new GlobalExceptionHandler())
                    .build();

    @Test
    void bindingFailure_reportaParametroSinTiposJava() throws Exception {
        mockMvc.perform(get("/probe").param("number", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.errors", hasSize(1)))
                .andExpect(jsonPath("$.errors[0].field").value("number"))
                .andExpect(
                        jsonPath("$.errors[0].message")
                                .value("Invalid value for parameter 'number'"))
                .andExpect(content().string(not(containsString("java."))));
    }

    @Test
    void bindingValido_retorna200() throws Exception {
        mockMvc.perform(get("/probe").param("number", "7"))
                .andExpect(status().isOk())
                .andExpect(content().string("7"));
    }

    @Test
    void pathVariableNoNumerica_retorna400SinTiposJava() throws Exception {
        mockMvc.perform(get("/probe/items/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(content().string(not(containsString("java."))));
    }

    @Test
    void metodoNoSoportado_retorna405AboutBlank() throws Exception {
        mockMvc.perform(get("/probe/only-post"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.status").value(405));
    }

    record ProbeFilter(Long number) {}

    @Controller
    @RequestMapping("/probe")
    @ResponseBody
    static class ProbeController {

        @GetMapping
        String filter(@ModelAttribute ProbeFilter filter) {
            return String.valueOf(filter.number());
        }

        @GetMapping("/items/{id}")
        String byId(@PathVariable Long id) {
            return String.valueOf(id);
        }

        @PostMapping("/only-post")
        String onlyPost() {
            return "ok";
        }
    }
}
