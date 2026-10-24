package com.booqi.booking.controller;

import com.booqi.booking.dto.request.BookingFilter;
import com.booqi.booking.dto.request.CreateBookingRequest;
import com.booqi.booking.dto.response.BookingResponse;
import com.booqi.booking.exception.BusinessException;
import com.booqi.booking.exception.ConflictException;
import com.booqi.booking.exception.InvalidFilterException;
import com.booqi.booking.exception.RemoteServiceException;
import com.booqi.booking.exception.ResourceNotFoundException;
import com.booqi.booking.service.BookingService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookingController.class)
@ActiveProfiles("test")
class BookingControllerTest {

    private static final String BOOKINGS = "/api/v1/bookings";
    private static final MediaType PROBLEM = MediaType.APPLICATION_PROBLEM_JSON;

    private static final String VALID_CREATE = """
            {
              "userId": 10,
              "eventId": 20,
              "ticketQuantity": 2
            }
            """;

    private final MockMvc mockMvc;

    @MockitoBean
    private BookingService bookingService;

    BookingControllerTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
    }

    private static BookingResponse booking(long id, String status) {
        return new BookingResponse(id, 10L, "Juan", "Pérez", "juan@example.com", 20L, "Concierto Rock",
                "Gran evento", LocalDateTime.of(2026, 6, 15, 20, 0), "Lima", 2,
                new BigDecimal("50.00"), new BigDecimal("100.00"), status,
                LocalDateTime.of(2026, 1, 1, 10, 0), LocalDateTime.of(2026, 1, 1, 10, 0));
    }

    private static String createBody(String field, Object value) {
        return VALID_CREATE.replaceFirst("\"" + field + "\": [^,\\n]*", "\"" + field + "\": " + value);
    }

    // POST /api/v1/bookings

    @Test
    void create_retorna201ConLocationYCuerpo() throws Exception {
        when(bookingService.create(any(CreateBookingRequest.class))).thenReturn(booking(5, "PENDING"));

        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/bookings/5"))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalPrice").value(100.00))
                .andExpect(jsonPath("$.eventStartDate").value("2026-06-15T20:00:00"))
                .andExpect(jsonPath("$.createdAt").value("2026-01-01T10:00:00"))
                .andExpect(jsonPath("$.updatedAt").value("2026-01-01T10:00:00"));

        ArgumentCaptor<CreateBookingRequest> captor = ArgumentCaptor.forClass(CreateBookingRequest.class);
        verify(bookingService).create(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new CreateBookingRequest(10L, 20L, 2));
    }

    static Stream<Arguments> cantidadesInvalidas() {
        return Stream.of(Arguments.of("0", "La cantidad de tickets debe ser al menos 1"),
                Arguments.of("-1", "La cantidad de tickets debe ser al menos 1"),
                Arguments.of("null", "La cantidad de tickets es requerida"));
    }

    @ParameterizedTest(name = "ticketQuantity {0} -> 400")
    @MethodSource("cantidadesInvalidas")
    void create_conCantidadInvalida_retorna400ConErrores(String quantity, String message) throws Exception {
        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("ticketQuantity", quantity)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Validation failed"))
                .andExpect(jsonPath("$.instance").value(BOOKINGS))
                .andExpect(jsonPath("$.errors[0].field").value("ticketQuantity"))
                .andExpect(jsonPath("$.errors[0].message").value(message));
        verifyNoInteractions(bookingService);
    }

    @Test
    void create_conCantidadUno_limiteInferiorValido_retorna201() throws Exception {
        when(bookingService.create(any())).thenReturn(booking(5, "PENDING"));

        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("ticketQuantity", "1")))
                .andExpect(status().isCreated());
    }

    @Test
    void create_sinUserId_retorna400ConErrorDeUserId() throws Exception {
        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("userId", "null")))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.errors[0].field").value("userId"))
                .andExpect(jsonPath("$.errors[0].message").value("El ID del usuario es requerido"));
        verifyNoInteractions(bookingService);
    }

    @Test
    void create_sinEventId_retorna400ConErrorDeEventId() throws Exception {
        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("eventId", "null")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("eventId"))
                .andExpect(jsonPath("$.errors[0].message").value("El ID del evento es requerido"));
        verifyNoInteractions(bookingService);
    }

    @Test
    void create_conJsonMalformado_retorna400Problem() throws Exception {
        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON).content("{\"userId\": "))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.instance").value(BOOKINGS));
        verifyNoInteractions(bookingService);
    }

    @Test
    void create_conConflict_retorna409() throws Exception {
        when(bookingService.create(any())).thenThrow(new ConflictException("Booking already exists"));

        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Conflict", "status": 409,
                         "detail": "Booking already exists", "instance": "/api/v1/bookings"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void create_conBusinessException_retorna422() throws Exception {
        when(bookingService.create(any())).thenThrow(new BusinessException("Some rule failed"));

        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isUnprocessableContent())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Unprocessable Content", "status": 422,
                         "detail": "Some rule failed", "instance": "/api/v1/bookings"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void create_conUsuarioRemotoInexistente_retorna404() throws Exception {
        when(bookingService.create(any())).thenThrow(new ResourceNotFoundException("User with id 999 not found"));

        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON).content(createBody("userId", "999")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Not Found", "status": 404,
                         "detail": "User with id 999 not found", "instance": "/api/v1/bookings"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void create_conServicioRemotoNoDisponible_retorna503() throws Exception {
        when(bookingService.create(any())).thenThrow(new RemoteServiceException("Event service is unavailable"));

        mockMvc.perform(post(BOOKINGS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Service Unavailable", "status": 503,
                         "detail": "Event service is unavailable", "instance": "/api/v1/bookings"}
                        """, JsonCompareMode.STRICT));
    }

    // GET /api/v1/bookings

    @Test
    void list_sinParametros_pasaFiltroVacioAlServicio() throws Exception {
        when(bookingService.findAll(any(BookingFilter.class))).thenReturn(List.of(booking(1, "PENDING")));

        mockMvc.perform(get(BOOKINGS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].userId").value(10));

        ArgumentCaptor<BookingFilter> captor = ArgumentCaptor.forClass(BookingFilter.class);
        verify(bookingService).findAll(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new BookingFilter(null, null, null));
    }

    @Test
    void list_conParametros_losVinculaEnBookingFilter() throws Exception {
        when(bookingService.findAll(any(BookingFilter.class))).thenReturn(List.of());

        mockMvc.perform(get(BOOKINGS).param("userId", "3").param("eventId", "2").param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        ArgumentCaptor<BookingFilter> captor = ArgumentCaptor.forClass(BookingFilter.class);
        verify(bookingService).findAll(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new BookingFilter(3L, 2L, "PENDING"));
    }

    @Test
    void list_conFiltroInvalido_retorna400Problem() throws Exception {
        when(bookingService.findAll(any(BookingFilter.class)))
                .thenThrow(new InvalidFilterException("Only one filter may be used at a time"));

        mockMvc.perform(get(BOOKINGS).param("userId", "3").param("status", "PENDING"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Bad Request", "status": 400,
                         "detail": "Only one filter may be used at a time", "instance": "/api/v1/bookings"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void list_conUserIdNoNumerico_retorna400Problem() throws Exception {
        mockMvc.perform(get(BOOKINGS).param("userId", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.instance").value(BOOKINGS))
                .andExpect(jsonPath("$.errors[0].field").value("userId"))
                .andExpect(jsonPath("$.errors[0].message").value("Invalid value for parameter 'userId'"))
                .andExpect(content().string(not(containsString("java."))));
        verifyNoInteractions(bookingService);
    }

    @Test
    void list_errorInesperado_retorna500Generico() throws Exception {
        when(bookingService.findAll(any(BookingFilter.class))).thenThrow(new RuntimeException("boom secret"));

        mockMvc.perform(get(BOOKINGS))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.instance").value(BOOKINGS))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(content().string(not(containsString("boom secret"))));
    }

    // GET /api/v1/bookings/{id}

    @Test
    void findById_retorna200() throws Exception {
        when(bookingService.findById(1L)).thenReturn(booking(1, "PENDING"));

        mockMvc.perform(get(BOOKINGS + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.userFirstName").value("Juan"));
    }

    @Test
    void findById_inexistente_retorna404ProblemExacto() throws Exception {
        when(bookingService.findById(999L)).thenThrow(new ResourceNotFoundException("Booking with id 999 not found"));

        mockMvc.perform(get(BOOKINGS + "/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Not Found", "status": 404,
                         "detail": "Booking with id 999 not found", "instance": "/api/v1/bookings/999"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void findById_noNumerico_retorna400Problem() throws Exception {
        mockMvc.perform(get(BOOKINGS + "/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.instance").value("/api/v1/bookings/abc"))
                .andExpect(content().string(not(containsString("java."))));
        verifyNoInteractions(bookingService);
    }

    @Test
    void rutasLegadas_retornan404() throws Exception {
        mockMvc.perform(get("/api/bookings")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/bookings/user/10")).andExpect(status().isNotFound());
        mockMvc.perform(get(BOOKINGS + "/health")).andExpect(status().isBadRequest());
    }

    // PATCH /api/v1/bookings/{id}/confirm|cancel

    @Test
    void confirm_retorna200ConLaReserva() throws Exception {
        when(bookingService.confirm(1L)).thenReturn(booking(1, "CONFIRMED"));

        mockMvc.perform(patch(BOOKINGS + "/1/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void confirm_inexistente_retorna404() throws Exception {
        when(bookingService.confirm(999L)).thenThrow(new ResourceNotFoundException("Booking with id 999 not found"));

        mockMvc.perform(patch(BOOKINGS + "/999/confirm"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.instance").value("/api/v1/bookings/999/confirm"));
    }

    @Test
    void cancel_retorna200ConLaReserva() throws Exception {
        when(bookingService.cancel(1L)).thenReturn(booking(1, "CANCELLED"));

        mockMvc.perform(patch(BOOKINGS + "/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void cancel_inexistente_retorna404() throws Exception {
        when(bookingService.cancel(999L)).thenThrow(new ResourceNotFoundException("Booking with id 999 not found"));

        mockMvc.perform(patch(BOOKINGS + "/999/cancel"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.detail").value("Booking with id 999 not found"));
    }
}
