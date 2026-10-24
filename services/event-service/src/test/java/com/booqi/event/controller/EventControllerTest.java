package com.booqi.event.controller;

import com.booqi.event.dto.request.CreateEventRequest;
import com.booqi.event.dto.request.EventFilter;
import com.booqi.event.dto.request.UpdateEventRequest;
import com.booqi.event.dto.response.EventResponse;
import com.booqi.event.exception.BusinessException;
import com.booqi.event.exception.ConflictException;
import com.booqi.event.exception.InvalidFilterException;
import com.booqi.event.exception.ResourceNotFoundException;
import com.booqi.event.service.EventService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventController.class)
@ActiveProfiles("test")
class EventControllerTest {

    private static final String EVENTS = "/api/v1/events";
    private static final MediaType PROBLEM = MediaType.APPLICATION_PROBLEM_JSON;
    private static final String START = "2030-06-15T20:00:00";
    private static final String END = "2030-06-15T23:00:00";

    private static final String VALID_CREATE = """
            {
              "title": "Festival de Jazz",
              "availableTickets": 100,
              "location": "Madrid",
              "startDate": "2030-06-15T20:00:00",
              "endDate": "2030-06-15T23:00:00",
              "organizer": "Jazz Madrid",
              "price": 20.0,
              "category": "Música",
              "contactEmail": "new@event.com",
              "contactPhone": "910123456"
            }
            """;

    private final MockMvc mockMvc;

    @MockitoBean
    private EventService eventService;

    EventControllerTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
    }

    private static EventResponse event(long id, int availableTickets) {
        return new EventResponse(id, "Festival de Food Trucks", "Comida callejera", availableTickets, "Madrid",
                LocalDateTime.parse(START), LocalDateTime.parse(END), "Asociación Foodies Madrid", 45.0,
                "Gastronomía", "contacto@foodtruckfest.com", "910000001", "https://img.booqi.com/food.jpg",
                LocalDateTime.of(2026, 1, 1, 0, 0), LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    private static String quote(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private static String createBody(String field, Object value) {
        String json = value instanceof String text ? quote(text) : String.valueOf(value);
        return VALID_CREATE.replaceFirst("\"" + field + "\": [^,\\n]*", "\"" + field + "\": " + json.replace("$", "\\$"));
    }

    private static String createBodyWith(String extraField, String value) {
        return VALID_CREATE.replace("\"title\"", "\"" + extraField + "\": " + quote(value) + ",\n  \"title\"");
    }

    // POST /api/v1/events

    @Test
    void create_retorna201ConLocationYCuerpo() throws Exception {
        when(eventService.create(any(CreateEventRequest.class))).thenReturn(event(5, 100));

        mockMvc.perform(post(EVENTS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/events/5"))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.organizer").value("Asociación Foodies Madrid"))
                .andExpect(jsonPath("$.imageUrl").value("https://img.booqi.com/food.jpg"))
                .andExpect(jsonPath("$.price").value(45.0))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists())
                .andExpect(jsonPath("$.idEvent").doesNotExist())
                .andExpect(jsonPath("$.organized").doesNotExist())
                .andExpect(jsonPath("$.urlImage").doesNotExist());
    }

    @Test
    void create_sinOrganizer_retorna400ConErrores() throws Exception {
        mockMvc.perform(post(EVENTS).contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_CREATE.replace("\"organizer\": \"Jazz Madrid\",", "")))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Validation failed"))
                .andExpect(jsonPath("$.instance").value("/api/v1/events"))
                .andExpect(jsonPath("$.errors[0].field").value("organizer"))
                .andExpect(jsonPath("$.errors[0].message").value("El organizador es obligatorio"));
        verifyNoInteractions(eventService);
    }

    @Test
    void create_conInicioPasado_retorna400ConErrorDeStartDate() throws Exception {
        mockMvc.perform(post(EVENTS).contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("startDate", LocalDateTime.now().minusDays(1).withNano(0).toString())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("startDate")));
    }

    @Test
    void create_conJsonMalformado_retorna400Problem() throws Exception {
        mockMvc.perform(post(EVENTS).contentType(MediaType.APPLICATION_JSON).content("{\"title\": "))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.instance").value("/api/v1/events"));
    }

    @Test
    void create_conEmailDuplicado_retorna409() throws Exception {
        when(eventService.create(any())).thenThrow(
                new ConflictException("Event with contactEmail new@event.com already exists"));

        mockMvc.perform(post(EVENTS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Conflict", "status": 409,
                         "detail": "Event with contactEmail new@event.com already exists",
                         "instance": "/api/v1/events"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void create_conFinAntesQueInicio_retorna422() throws Exception {
        when(eventService.create(any())).thenThrow(new BusinessException("End date cannot be before start date"));

        mockMvc.perform(post(EVENTS).contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("endDate", "2030-06-15T19:00:00")))
                .andExpect(status().isUnprocessableContent())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Unprocessable Content", "status": 422,
                         "detail": "End date cannot be before start date", "instance": "/api/v1/events"}
                        """, JsonCompareMode.STRICT));
    }

    static Stream<Arguments> createBoundaries() {
        return Stream.of(
                Arguments.of("title null", createBody("title", null), 400),
                Arguments.of("title 2", createBody("title", "AB"), 400),
                Arguments.of("title 3", createBody("title", "ABC"), 201),
                Arguments.of("title 200", createBody("title", "A".repeat(200)), 201),
                Arguments.of("title 201", createBody("title", "A".repeat(201)), 400),
                Arguments.of("description 2000", createBodyWith("description", "A".repeat(2000)), 201),
                Arguments.of("description 2001", createBodyWith("description", "A".repeat(2001)), 400),
                Arguments.of("tickets -1", createBody("availableTickets", -1), 400),
                Arguments.of("tickets 0", createBody("availableTickets", 0), 201),
                Arguments.of("tickets null", createBody("availableTickets", null), 400),
                Arguments.of("location 2", createBody("location", "AB"), 400),
                Arguments.of("location 3", createBody("location", "ABC"), 201),
                Arguments.of("location 200", createBody("location", "A".repeat(200)), 201),
                Arguments.of("location 201", createBody("location", "A".repeat(201)), 400),
                Arguments.of("startDate future", createBody("startDate", START), 201),
                Arguments.of("endDate null", createBody("endDate", null), 400),
                Arguments.of("organizer 2", createBody("organizer", "AB"), 400),
                Arguments.of("organizer 3", createBody("organizer", "ABC"), 201),
                Arguments.of("organizer 100", createBody("organizer", "A".repeat(100)), 201),
                Arguments.of("organizer 101", createBody("organizer", "A".repeat(101)), 400),
                Arguments.of("price -0.01", createBody("price", -0.01), 400),
                Arguments.of("price 0", createBody("price", 0.0), 201),
                Arguments.of("category 2", createBody("category", "AB"), 400),
                Arguments.of("category 3", createBody("category", "ABC"), 201),
                Arguments.of("category 50", createBody("category", "A".repeat(50)), 201),
                Arguments.of("category 51", createBody("category", "A".repeat(51)), 400),
                Arguments.of("email invalid", createBody("contactEmail", "not-an-email"), 400),
                Arguments.of("email no domain", createBody("contactEmail", "info@"), 400),
                Arguments.of("phone 8", createBody("contactPhone", "12345678"), 400),
                Arguments.of("phone 9", createBody("contactPhone", "123456789"), 201),
                Arguments.of("phone 15", createBody("contactPhone", "123456789012345"), 201),
                Arguments.of("phone 16", createBody("contactPhone", "1234567890123456"), 400),
                Arguments.of("phone letters", createBody("contactPhone", "91012345A"), 400),
                Arguments.of("phone +9", createBody("contactPhone", "+123456789"), 201),
                Arguments.of("imageUrl valid", createBodyWith("imageUrl", "https://img.booqi.com/a.jpg"), 201),
                Arguments.of("imageUrl empty", createBodyWith("imageUrl", ""), 201),
                Arguments.of("imageUrl invalid", createBodyWith("imageUrl", "not a url"), 400));
    }

    @ParameterizedTest(name = "{0} -> {2}")
    @MethodSource("createBoundaries")
    void create_validacionDeLimites(String caseName, String body, int expectedStatus) throws Exception {
        when(eventService.create(any())).thenReturn(event(5, 100));

        mockMvc.perform(post(EVENTS).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is(expectedStatus));
    }

    // GET /api/v1/events

    @Test
    void list_sinParametros_pasaFiltroVacioAlServicio() throws Exception {
        when(eventService.findAll(any(EventFilter.class))).thenReturn(List.of(event(1, 15)));

        mockMvc.perform(get(EVENTS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].organizer").value("Asociación Foodies Madrid"));

        ArgumentCaptor<EventFilter> captor = ArgumentCaptor.forClass(EventFilter.class);
        verify(eventService).findAll(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new EventFilter(null, null, null, null, null));
    }

    @Test
    void list_conParametros_losVinculaEnEventFilter() throws Exception {
        when(eventService.findAll(any(EventFilter.class))).thenReturn(List.of());

        mockMvc.perform(get(EVENTS)
                        .param("contactEmail", "contacto@foodtruckfest.com")
                        .param("title", "jazz")
                        .param("category", "Música")
                        .param("location", "Madrid")
                        .param("organizer", "foodies"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        ArgumentCaptor<EventFilter> captor = ArgumentCaptor.forClass(EventFilter.class);
        verify(eventService).findAll(captor.capture());
        assertThat(captor.getValue())
                .isEqualTo(new EventFilter("contacto@foodtruckfest.com", "jazz", "Música", "Madrid", "foodies"));
    }

    @Test
    void list_conFiltroInvalido_retorna400Problem() throws Exception {
        when(eventService.findAll(any(EventFilter.class)))
                .thenThrow(new InvalidFilterException("Only one filter may be used at a time"));

        mockMvc.perform(get(EVENTS).param("title", "jazz").param("category", "Música"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Bad Request", "status": 400,
                         "detail": "Only one filter may be used at a time", "instance": "/api/v1/events"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void list_errorInesperado_retorna500Generico() throws Exception {
        when(eventService.findAll(any(EventFilter.class))).thenThrow(new RuntimeException("boom secret"));

        mockMvc.perform(get(EVENTS))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.instance").value("/api/v1/events"))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(jsonPath("$.exception").doesNotExist())
                .andExpect(content().string(not(containsString("boom secret"))))
                .andExpect(content().string(not(containsString("RuntimeException"))));
    }

    // GET /api/v1/events/{id}

    @Test
    void findById_retorna200() throws Exception {
        when(eventService.findById(1L)).thenReturn(event(1, 15));

        mockMvc.perform(get(EVENTS + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Festival de Food Trucks"))
                .andExpect(jsonPath("$.imageUrl").value("https://img.booqi.com/food.jpg"));
    }

    @Test
    void findById_inexistente_retorna404ProblemExacto() throws Exception {
        when(eventService.findById(99L)).thenThrow(new ResourceNotFoundException("Event with id 99 not found"));

        mockMvc.perform(get(EVENTS + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Not Found", "status": 404,
                         "detail": "Event with id 99 not found", "instance": "/api/v1/events/99"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void findById_noNumerico_retorna400Problem() throws Exception {
        mockMvc.perform(get(EVENTS + "/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.instance").value("/api/v1/events/abc"))
                .andExpect(content().string(not(containsString("java."))))
                .andExpect(content().string(not(containsString("NumberFormatException"))));
        verifyNoInteractions(eventService);
    }

    @Test
    void decrementStock_cantidadNoNumerica_retorna400SinTiposJava() throws Exception {
        mockMvc.perform(patch(EVENTS + "/1/stock").param("quantity", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(content().string(not(containsString("java."))));
        verifyNoInteractions(eventService);
    }

    @Test
    void rutasLegadas_retornan404() throws Exception {
        mockMvc.perform(get("/api/events")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/events/search/title").param("title", "jazz")).andExpect(status().isNotFound());
        mockMvc.perform(get(EVENTS + "/exists/email/contacto@foodtruckfest.com"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM));
    }

    // PUT /api/v1/events/{id}

    @Test
    void update_retorna200YPasaElCuerpoParcial() throws Exception {
        when(eventService.update(eq(1L), any(UpdateEventRequest.class))).thenReturn(event(1, 15));

        mockMvc.perform(put(EVENTS + "/1").contentType(MediaType.APPLICATION_JSON).content("""
                        {"organizer": "Nuevo Organizador"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        ArgumentCaptor<UpdateEventRequest> captor = ArgumentCaptor.forClass(UpdateEventRequest.class);
        verify(eventService).update(eq(1L), captor.capture());
        assertThat(captor.getValue()).isEqualTo(new UpdateEventRequest(null, null, null, null, null, null,
                "Nuevo Organizador", null, null, null, null, null));
    }

    @Test
    void update_inexistente_retorna404() throws Exception {
        when(eventService.update(eq(99L), any())).thenThrow(new ResourceNotFoundException("Event with id 99 not found"));

        mockMvc.perform(put(EVENTS + "/99").contentType(MediaType.APPLICATION_JSON).content("""
                        {"title": "Nuevo título"}
                        """))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.instance").value("/api/v1/events/99"));
    }

    @Test
    void update_emailDuplicado_retorna409() throws Exception {
        when(eventService.update(eq(2L), any())).thenThrow(
                new ConflictException("Event with contactEmail contacto@foodtruckfest.com already exists"));

        mockMvc.perform(put(EVENTS + "/2").contentType(MediaType.APPLICATION_JSON).content("""
                        {"contactEmail": "contacto@foodtruckfest.com"}
                        """))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void update_conFinAntesQueInicio_retorna422() throws Exception {
        when(eventService.update(eq(1L), any())).thenThrow(new BusinessException("End date cannot be before start date"));

        mockMvc.perform(put(EVENTS + "/1").contentType(MediaType.APPLICATION_JSON).content("""
                        {"startDate": "2030-06-15T20:00:00", "endDate": "2030-06-15T19:00:00"}
                        """))
                .andExpect(status().isUnprocessableContent())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.detail").value("End date cannot be before start date"))
                .andExpect(jsonPath("$.instance").value("/api/v1/events/1"));
    }

    static Stream<Arguments> updateBoundaries() {
        return Stream.of(
                Arguments.of("{\"title\": \"Nuevo título\"}", 200),
                Arguments.of("{\"title\": \"AB\"}", 400),
                Arguments.of("{\"price\": -1}", 400),
                Arguments.of("{\"price\": 0}", 200),
                Arguments.of("{\"availableTickets\": -5}", 400),
                Arguments.of("{\"availableTickets\": 0}", 200),
                Arguments.of("{\"contactPhone\": \"123abc\"}", 400),
                Arguments.of("{\"contactEmail\": \"no-email\"}", 400),
                Arguments.of("{\"organizer\": \"" + "A".repeat(101) + "\"}", 400));
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @MethodSource("updateBoundaries")
    void update_validacionDeLimites(String body, int expectedStatus) throws Exception {
        when(eventService.update(eq(1L), any())).thenReturn(event(1, 15));

        mockMvc.perform(put(EVENTS + "/1").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is(expectedStatus));
    }

    @Test
    void update_conPrecioNegativo_retorna400ConErrorDePrice() throws Exception {
        mockMvc.perform(put(EVENTS + "/1").contentType(MediaType.APPLICATION_JSON).content("""
                        {"price": -1}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.errors[0].field").value("price"));
        verifyNoInteractions(eventService);
    }

    // DELETE /api/v1/events/{id}

    @Test
    void delete_retorna204SinCuerpo() throws Exception {
        mockMvc.perform(delete(EVENTS + "/6"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
        verify(eventService).delete(6L);
    }

    @Test
    void delete_inexistente_retorna404() throws Exception {
        doThrow(new ResourceNotFoundException("Event with id 99 not found")).when(eventService).delete(99L);

        mockMvc.perform(delete(EVENTS + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.detail").value("Event with id 99 not found"));
    }

    // PATCH /api/v1/events/{id}/stock

    @Test
    void decrementStock_retorna200ConEventoActualizado() throws Exception {
        when(eventService.decrementStock(1L, 2)).thenReturn(event(1, 13));

        mockMvc.perform(patch(EVENTS + "/1/stock").param("quantity", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.availableTickets").value(13));
    }

    @Test
    void decrementStock_inexistente_retorna404() throws Exception {
        when(eventService.decrementStock(99L, 1)).thenThrow(new ResourceNotFoundException("Event with id 99 not found"));

        mockMvc.perform(patch(EVENTS + "/99/stock").param("quantity", "1"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.instance").value("/api/v1/events/99/stock"));
    }

    @Test
    void decrementStock_stockInsuficiente_retorna422() throws Exception {
        when(eventService.decrementStock(3L, 5)).thenThrow(
                new BusinessException("Insufficient stock for event 3: available 4, requested 5"));

        mockMvc.perform(patch(EVENTS + "/3/stock").param("quantity", "5"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Unprocessable Content", "status": 422,
                         "detail": "Insufficient stock for event 3: available 4, requested 5",
                         "instance": "/api/v1/events/3/stock"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void decrementStock_cantidadCero_retorna422() throws Exception {
        when(eventService.decrementStock(1L, 0)).thenThrow(new BusinessException("Quantity must be greater than zero"));

        mockMvc.perform(patch(EVENTS + "/1/stock").param("quantity", "0"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.detail").value("Quantity must be greater than zero"))
                .andExpect(jsonPath("$.instance").value("/api/v1/events/1/stock"));
    }

    @Test
    void decrementStock_sinQuantity_retorna400Problem() throws Exception {
        mockMvc.perform(patch(EVENTS + "/1/stock"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.instance").value("/api/v1/events/1/stock"));
        verifyNoInteractions(eventService);
    }
}
