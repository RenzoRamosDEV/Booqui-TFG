package org.service_event.event.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.service_event.event.service.EventService;
import org.service_event.event.service.model.EventCreateDTO;
import org.service_event.event.service.model.EventResponseDTO;
import org.service_event.event.service.model.EventUpdateDTO;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class EventControllerTest {

    @Mock
    private EventService eventService;

    @InjectMocks
    private EventController eventController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final LocalDateTime FUTURE_START = LocalDateTime.now().plusDays(10);
    private static final LocalDateTime FUTURE_END = LocalDateTime.now().plusDays(11);

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(eventController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────

    private EventCreateDTO validCreateDTO() {
        return EventCreateDTO.builder()
                .title("Festival de Música")
                .availableTickets(100)
                .location("Madrid")
                .startDate(FUTURE_START)
                .endDate(FUTURE_END)
                .organized("Rock Prod")
                .price(45.50)
                .category("Música")
                .contactEmail("info@fest.com")
                .contactPhone("910123456")
                .build();
    }

    private EventResponseDTO sampleResponse() {
        return EventResponseDTO.builder()
                .idEvent(1L)
                .title("Festival de Música")
                .availableTickets(100)
                .location("Madrid")
                .startDate(FUTURE_START)
                .endDate(FUTURE_END)
                .organized("Rock Prod")
                .price(45.50)
                .category("Música")
                .contactEmail("info@fest.com")
                .contactPhone("910123456")
                .build();
    }

    // ────────────────────────────────────────────────────────────────
    // POST /api/events — createEvent
    // ────────────────────────────────────────────────────────────────

    @Test
    void createEvent_datosValidos_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validCreateDTO())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idEvent").value(1L));
    }

    @Test
    void createEvent_tituloAusente_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setTitle(null);

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // título: límite inferior
    @Test
    void createEvent_titulo2chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setTitle("AB");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_titulo3chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setTitle("ABC");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_titulo200chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setTitle("A".repeat(200));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_titulo201chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setTitle("A".repeat(201));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // availableTickets: límite inferior
    @Test
    void createEvent_ticketsNegativos_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setAvailableTickets(-1);

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_ticketsCero_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setAvailableTickets(0);

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    // startDate: @Future
    @Test
    void createEvent_startDatePasada_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setStartDate(LocalDateTime.now().minusDays(1));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_startDateFutura_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validCreateDTO())))
                .andExpect(status().isCreated());
    }

    // price
    @Test
    void createEvent_precioNegativo_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setPrice(-0.01);

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_precioCero_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setPrice(0.0);

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    // contactEmail
    @Test
    void createEvent_emailInvalido_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setContactEmail("no-es-email");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_emailSinDominio_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setContactEmail("user@");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // contactPhone
    @Test
    void createEvent_telefono8digitos_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setContactPhone("12345678");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_telefono9digitos_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setContactPhone("123456789");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_telefono15digitos_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setContactPhone("123456789012345");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_telefono16digitos_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setContactPhone("1234567890123456");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_telefonoConLetras_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setContactPhone("12345abc9");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_telefonoConMasY9Digitos_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setContactPhone("+123456789");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    // category: límites
    @Test
    void createEvent_categoria2chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setCategory("AB");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_categoria3chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setCategory("ABC");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_categoria50chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setCategory("A".repeat(50));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_categoria51chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setCategory("A".repeat(51));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // location: límites (min=3, max=200)
    @Test
    void createEvent_location2chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setLocation("AB");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_location3chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setLocation("ABC");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_location200chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setLocation("A".repeat(200));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_location201chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setLocation("A".repeat(201));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // organized: límites
    @Test
    void createEvent_organizador2chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setOrganized("AB");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEvent_organizador3chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setOrganized("ABC");

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_organizador100chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setOrganized("A".repeat(100));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_organizador101chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setOrganized("A".repeat(101));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // description: límites (max=2000)
    @Test
    void createEvent_descripcion2000chars_retorna201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(sampleResponse());
        EventCreateDTO dto = validCreateDTO();
        dto.setDescription("A".repeat(2000));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void createEvent_descripcion2001chars_retorna400() throws Exception {
        EventCreateDTO dto = validCreateDTO();
        dto.setDescription("A".repeat(2001));

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events — getAllEvents
    // ────────────────────────────────────────────────────────────────

    @Test
    void getAllEvents_retorna200ConLista() throws Exception {
        Collection<EventResponseDTO> list = List.of(sampleResponse());
        when(eventService.getAllEvents()).thenReturn(list);

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idEvent").value(1L));
    }

    @Test
    void getAllEvents_listaVacia_retorna200() throws Exception {
        when(eventService.getAllEvents()).thenReturn(List.of());

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events/{id} — getEventById
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventById_encontrado_retorna200() throws Exception {
        when(eventService.getEventById(1L)).thenReturn(Optional.of(sampleResponse()));

        mockMvc.perform(get("/api/events/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idEvent").value(1L));
    }

    @Test
    void getEventById_noEncontrado_retorna404() throws Exception {
        when(eventService.getEventById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/events/99"))
                .andExpect(status().isNotFound());
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events/email/{email} — getEventByContactEmail
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventByEmail_encontrado_retorna200() throws Exception {
        when(eventService.getEventByContactEmail("info@fest.com")).thenReturn(Optional.of(sampleResponse()));

        mockMvc.perform(get("/api/events/email/info@fest.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactEmail").value("info@fest.com"));
    }

    @Test
    void getEventByEmail_noEncontrado_retorna404() throws Exception {
        when(eventService.getEventByContactEmail(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/events/email/noexi@st.com"))
                .andExpect(status().isNotFound());
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events/search/title — getEventsByTitle
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventsByTitle_conTitulo_retorna200() throws Exception {
        when(eventService.getEventsByTitle("Festival")).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/events/search/title").param("title", "Festival"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Festival de Música"));
    }

    @Test
    void getEventsByTitle_resultadoVacio_retorna200() throws Exception {
        when(eventService.getEventsByTitle(anyString())).thenReturn(List.of());

        mockMvc.perform(get("/api/events/search/title").param("title", "NoExiste"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events/search/category — getEventsByCategory
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventsByCategory_retorna200() throws Exception {
        when(eventService.getEventsByCategory("Música")).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/events/search/category").param("category", "Música"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("Música"));
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events/search/location — getEventsByLocation
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventsByLocation_retorna200() throws Exception {
        when(eventService.getEventsByLocation("Madrid")).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/events/search/location").param("location", "Madrid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].location").value("Madrid"));
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events/search/organized — getEventsByOrganized
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventsByOrganized_retorna200() throws Exception {
        when(eventService.getEventsByOrganized("Rock Prod")).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/events/search/organized").param("organized", "Rock Prod"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].organized").value("Rock Prod"));
    }

    // ────────────────────────────────────────────────────────────────
    // PUT /api/events/email/{email} — updateEvent
    // ────────────────────────────────────────────────────────────────

    @Test
    void updateEvent_datosValidos_retorna200ConCuerpo() throws Exception {
        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .title("Nuevo Título")
                .build();
        when(eventService.updateEvent(eq("info@fest.com"), any())).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/events/email/info@fest.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idEvent").value(1L));
    }

    @Test
    void updateEvent_telefonoInvalidoEnUpdate_retorna400() throws Exception {
        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .contactPhone("123abc")
                .build();

        mockMvc.perform(put("/api/events/email/info@fest.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateEvent_emailInvalidoEnUpdate_retorna400() throws Exception {
        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .contactEmail("no-email")
                .build();

        mockMvc.perform(put("/api/events/email/info@fest.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateEvent_ticketsNegativosEnUpdate_retorna400() throws Exception {
        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .availableTickets(-5)
                .build();

        mockMvc.perform(put("/api/events/email/info@fest.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    // ────────────────────────────────────────────────────────────────
    // DELETE /api/events/email/{email} — deleteEvent
    // ────────────────────────────────────────────────────────────────

    @Test
    void deleteEvent_retorna204() throws Exception {
        doNothing().when(eventService).deleteEvent("info@fest.com");

        mockMvc.perform(delete("/api/events/email/info@fest.com"))
                .andExpect(status().isNoContent());
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events/exists/email/{email} — existsByContactEmail
    // ────────────────────────────────────────────────────────────────

    @Test
    void existsByContactEmail_existe_retornaTrue() throws Exception {
        when(eventService.existsByContactEmail("info@fest.com")).thenReturn(true);

        mockMvc.perform(get("/api/events/exists/email/info@fest.com"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void existsByContactEmail_noExiste_retornaFalse() throws Exception {
        when(eventService.existsByContactEmail(anyString())).thenReturn(false);

        mockMvc.perform(get("/api/events/exists/email/noexi@st.com"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }

    // ────────────────────────────────────────────────────────────────
    // GET /api/events/health
    // ────────────────────────────────────────────────────────────────

    @Test
    void healthCheck_retorna200ConCuerpo() throws Exception {
        mockMvc.perform(get("/api/events/health"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Event Service")));
    }

    // ────────────────────────────────────────────────────────────────
    // PATCH /api/events/{eventId}/stock — decrementStock
    // ────────────────────────────────────────────────────────────────

    @Test
    void decrementStock_valido_retorna200YLlamaServicio() throws Exception {
        doNothing().when(eventService).decrementStock(1L, 5);

        mockMvc.perform(patch("/api/events/1/stock").param("quantity", "5"))
                .andExpect(status().isOk());

        verify(eventService).decrementStock(1L, 5);
    }
}
