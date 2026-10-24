package com.booqi.payment.controller;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.booqi.payment.dto.request.CreatePaymentRequest;
import com.booqi.payment.dto.request.PaymentFilter;
import com.booqi.payment.dto.response.PaymentResponse;
import com.booqi.payment.exception.BusinessException;
import com.booqi.payment.exception.ConflictException;
import com.booqi.payment.exception.InvalidFilterException;
import com.booqi.payment.exception.RemoteServiceException;
import com.booqi.payment.exception.ResourceNotFoundException;
import com.booqi.payment.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.slf4j.LoggerFactory;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
@ActiveProfiles("test")
class PaymentControllerTest {

    private static final String PAYMENTS = "/api/v1/payments";
    private static final MediaType PROBLEM = MediaType.APPLICATION_PROBLEM_JSON;
    private static final String CARD = "4111111111111112";

    private static final String VALID_CREATE = """
            {
              "bookingId": 1,
              "userId": 3,
              "eventId": 2,
              "ticketQuantity": 2,
              "totalPrice": 70.00,
              "paymentMethod": "CREDIT_CARD",
              "cardNumber": "4111111111111112",
              "cvv": "123"
            }
            """;

    private final MockMvc mockMvc;

    @MockitoBean
    private PaymentService paymentService;

    PaymentControllerTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
    }

    private static PaymentResponse payment(long id, String status) {
        return new PaymentResponse(id, 1L, 3L, 2L, 2, new BigDecimal("70.00"), "CREDIT_CARD", status, "tx-1", null,
                LocalDateTime.of(2026, 1, 1, 10, 0, 1), LocalDateTime.of(2026, 1, 1, 10, 0),
                LocalDateTime.of(2026, 1, 1, 10, 0, 1));
    }

    private static String createBody(String field, Object value) {
        return VALID_CREATE.replaceFirst("\"" + field + "\": [^,\\n]*", "\"" + field + "\": " + value);
    }

    // POST /api/v1/payments

    @Test
    void create_retorna201ConLocationYCuerpoSinDatosDeTarjeta() throws Exception {
        when(paymentService.process(any(CreatePaymentRequest.class))).thenReturn(payment(5, "APPROVED"));

        mockMvc.perform(post(PAYMENTS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/payments/5"))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.totalPrice").value(70.00))
                .andExpect(jsonPath("$.paymentDate").value("2026-01-01T10:00:01"))
                .andExpect(jsonPath("$.createdAt").value("2026-01-01T10:00:00"))
                .andExpect(jsonPath("$.updatedAt").value("2026-01-01T10:00:01"))
                .andExpect(jsonPath("$.paymentId").doesNotExist())
                .andExpect(jsonPath("$.creationDate").doesNotExist())
                .andExpect(jsonPath("$.cardNumber").doesNotExist())
                .andExpect(jsonPath("$.cvv").doesNotExist());

        ArgumentCaptor<CreatePaymentRequest> captor = ArgumentCaptor.forClass(CreatePaymentRequest.class);
        verify(paymentService).process(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new CreatePaymentRequest(1L, 3L, 2L, 2, new BigDecimal("70.00"),
                "CREDIT_CARD", CARD, "123"));
    }

    static Stream<Arguments> camposInvalidos() {
        return Stream.of(
                Arguments.of("bookingId", "null", "El ID de la reserva es requerido"),
                Arguments.of("userId", "null", "El ID del usuario es requerido"),
                Arguments.of("eventId", "null", "El ID del evento es requerido"),
                Arguments.of("ticketQuantity", "null", "La cantidad de tickets es requerida"),
                Arguments.of("ticketQuantity", "0", "La cantidad de tickets debe ser al menos 1"),
                Arguments.of("ticketQuantity", "-1", "La cantidad de tickets debe ser al menos 1"),
                Arguments.of("totalPrice", "null", "El precio total es requerido"),
                Arguments.of("totalPrice", "-1.00", "El precio total debe ser mayor o igual a 0"),
                Arguments.of("paymentMethod", "null", "El método de pago es requerido"),
                Arguments.of("paymentMethod", "\"CASH\"", "Método de pago inválido"),
                Arguments.of("paymentMethod", "\"BITCOIN\"", "Método de pago inválido"),
                Arguments.of("paymentMethod", "\"credit_card\"", "Método de pago inválido"),
                Arguments.of("paymentMethod", "\"CREDIT CARD\"", "Método de pago inválido"),
                Arguments.of("paymentMethod", "\"CREDIT\"", "Método de pago inválido"),
                Arguments.of("paymentMethod", "\"\"", "Método de pago inválido"));
    }

    @ParameterizedTest(name = "{0} = {1} -> 400")
    @MethodSource("camposInvalidos")
    void create_conCampoInvalido_retorna400ConErrores(String field, String value, String message) throws Exception {
        mockMvc.perform(post(PAYMENTS).contentType(MediaType.APPLICATION_JSON).content(createBody(field, value)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Validation failed"))
                .andExpect(jsonPath("$.instance").value(PAYMENTS))
                .andExpect(jsonPath("$.errors.length()").value(1))
                .andExpect(jsonPath("$.errors[0].field").value(field))
                .andExpect(jsonPath("$.errors[0].message").value(message));
        verifyNoInteractions(paymentService);
    }

    static Stream<Arguments> valoresLimiteValidos() {
        return Stream.of(
                Arguments.of("ticketQuantity", "1"),
                Arguments.of("ticketQuantity", "1000"),
                Arguments.of("totalPrice", "0"),
                Arguments.of("totalPrice", "0.01"),
                Arguments.of("totalPrice", "99999.99"),
                Arguments.of("paymentMethod", "\"DEBIT_CARD\""),
                Arguments.of("paymentMethod", "\"PAYPAL\""),
                Arguments.of("paymentMethod", "\"BANK_TRANSFER\""),
                Arguments.of("cardNumber", "null"));
    }

    @ParameterizedTest(name = "{0} = {1} -> 201")
    @MethodSource("valoresLimiteValidos")
    void create_conValorValido_retorna201(String field, String value) throws Exception {
        when(paymentService.process(any())).thenReturn(payment(5, "APPROVED"));

        mockMvc.perform(post(PAYMENTS).contentType(MediaType.APPLICATION_JSON).content(createBody(field, value)))
                .andExpect(status().isCreated());
    }

    @Test
    void create_conJsonMalformado_retorna400Problem() throws Exception {
        mockMvc.perform(post(PAYMENTS).contentType(MediaType.APPLICATION_JSON).content("{\"bookingId\": "))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.instance").value(PAYMENTS));
        verifyNoInteractions(paymentService);
    }

    @Test
    void create_conConflict_retorna409() throws Exception {
        when(paymentService.process(any())).thenThrow(new ConflictException("Payment already exists"));

        mockMvc.perform(post(PAYMENTS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Conflict", "status": 409,
                         "detail": "Payment already exists", "instance": "/api/v1/payments"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void create_conTotalPriceFueraDeRango_retorna422() throws Exception {
        when(paymentService.process(any()))
                .thenThrow(new BusinessException("Total price must not exceed 99999999.99"));

        mockMvc.perform(post(PAYMENTS).contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("totalPrice", "100000000.00")))
                .andExpect(status().isUnprocessableContent())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Unprocessable Content", "status": 422,
                         "detail": "Total price must not exceed 99999999.99", "instance": "/api/v1/payments"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void create_conServicioRemotoNoDisponible_retorna503() throws Exception {
        when(paymentService.process(any())).thenThrow(new RemoteServiceException("Event service is unavailable"));

        mockMvc.perform(post(PAYMENTS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Service Unavailable", "status": 503,
                         "detail": "Event service is unavailable", "instance": "/api/v1/payments"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void create_conDebug_noEscribeTarjetaNiCvvEnLosLogs() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger("com.booqi.payment");
        Level previous = logger.getLevel();
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.setLevel(Level.DEBUG);
        logger.addAppender(appender);
        try {
            when(paymentService.process(any())).thenReturn(payment(5, "APPROVED"));

            mockMvc.perform(post(PAYMENTS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                    .andExpect(status().isCreated());

            List<String> messages = appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
            assertThat(messages).isNotEmpty()
                    .noneMatch(message -> message.contains(CARD))
                    .noneMatch(message -> message.contains("cvv=123"));
        } finally {
            logger.detachAppender(appender);
            logger.setLevel(previous);
        }
    }

    // GET /api/v1/payments

    @Test
    void list_sinParametros_pasaFiltroVacioAlServicio() throws Exception {
        when(paymentService.findAll(any(PaymentFilter.class))).thenReturn(List.of(payment(1, "APPROVED")));

        mockMvc.perform(get(PAYMENTS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].userId").value(3));

        ArgumentCaptor<PaymentFilter> captor = ArgumentCaptor.forClass(PaymentFilter.class);
        verify(paymentService).findAll(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new PaymentFilter(null, null, null, null));
    }

    @Test
    void list_conParametros_losVinculaEnPaymentFilter() throws Exception {
        when(paymentService.findAll(any(PaymentFilter.class))).thenReturn(List.of());

        mockMvc.perform(get(PAYMENTS).param("userId", "3").param("eventId", "2").param("bookingId", "1")
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        ArgumentCaptor<PaymentFilter> captor = ArgumentCaptor.forClass(PaymentFilter.class);
        verify(paymentService).findAll(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new PaymentFilter(3L, 2L, 1L, "APPROVED"));
    }

    @Test
    void list_conFiltroInvalido_retorna400Problem() throws Exception {
        when(paymentService.findAll(any(PaymentFilter.class)))
                .thenThrow(new InvalidFilterException("Only one filter may be used at a time"));

        mockMvc.perform(get(PAYMENTS).param("userId", "3").param("status", "APPROVED"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Bad Request", "status": 400,
                         "detail": "Only one filter may be used at a time", "instance": "/api/v1/payments"}
                        """, JsonCompareMode.STRICT));
    }

    @ParameterizedTest(name = "{0}=abc -> 400")
    @ValueSource(strings = {"userId", "eventId", "bookingId"})
    void list_conIdNoNumerico_retorna400Problem(String param) throws Exception {
        mockMvc.perform(get(PAYMENTS).param(param, "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.instance").value(PAYMENTS));
        verifyNoInteractions(paymentService);
    }

    @Test
    void list_errorInesperado_retorna500Generico() throws Exception {
        when(paymentService.findAll(any(PaymentFilter.class))).thenThrow(new RuntimeException("boom secret"));

        mockMvc.perform(get(PAYMENTS))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.instance").value(PAYMENTS))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(content().string(not(containsString("boom secret"))));
    }

    // GET /api/v1/payments/{id}

    @Test
    void findById_retorna200() throws Exception {
        when(paymentService.findById(1L)).thenReturn(payment(1, "APPROVED"));

        mockMvc.perform(get(PAYMENTS + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.transactionId").value("tx-1"));
    }

    @Test
    void findById_inexistente_retorna404ProblemExacto() throws Exception {
        when(paymentService.findById(999L)).thenThrow(new ResourceNotFoundException("Payment with id 999 not found"));

        mockMvc.perform(get(PAYMENTS + "/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(content().json("""
                        {"type": "about:blank", "title": "Not Found", "status": 404,
                         "detail": "Payment with id 999 not found", "instance": "/api/v1/payments/999"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void findById_noNumerico_retorna400Problem() throws Exception {
        mockMvc.perform(get(PAYMENTS + "/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.instance").value("/api/v1/payments/abc"));
        verifyNoInteractions(paymentService);
    }

    @Test
    void rutasLegadas_retornan404() throws Exception {
        mockMvc.perform(get("/api/payments")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/payments/user/1")).andExpect(status().isNotFound());
        mockMvc.perform(get(PAYMENTS + "/user/1")).andExpect(status().isNotFound());
        mockMvc.perform(get(PAYMENTS + "/health")).andExpect(status().isBadRequest());
    }
}
