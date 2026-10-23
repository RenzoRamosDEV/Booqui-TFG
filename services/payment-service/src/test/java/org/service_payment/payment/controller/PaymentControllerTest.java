package org.service_payment.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.service_payment.payment.service.PaymentService;
import org.service_payment.payment.service.model.PaymentCreateDTO;
import org.service_payment.payment.service.model.PaymentResponseDTO;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentController paymentController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private PaymentCreateDTO validDTO() {
        return PaymentCreateDTO.builder()
                .bookingId(1L)
                .userId(1L)
                .eventId(1L)
                .ticketQuantity(2)
                .totalPrice(new BigDecimal("100.00"))
                .paymentMethod("CREDIT_CARD")
                .cardNumber("4111111111111112")
                .build();
    }

    private PaymentResponseDTO approvedResponse() {
        return PaymentResponseDTO.builder()
                .paymentId(1L)
                .bookingId(1L)
                .userId(1L)
                .eventId(1L)
                .ticketQuantity(2)
                .totalPrice(new BigDecimal("100.00"))
                .paymentMethod("CREDIT_CARD")
                .status("APPROVED")
                .transactionId("TXN-001")
                .paymentDate(LocalDateTime.now())
                .creationDate(LocalDateTime.now())
                .build();
    }

    // ─── POST /api/payments ──────────────────────────────────────────────────

    @Test
    void processPayment_datosValidos_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validDTO())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentId").value(1L))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void processPayment_bookingIdNulo_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setBookingId(null);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_userIdNulo_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setUserId(null);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_eventIdNulo_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setEventId(null);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_ticketQuantityNulo_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setTicketQuantity(null);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_ticketQuantityCero_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setTicketQuantity(0);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_ticketQuantityUno_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());
        PaymentCreateDTO dto = validDTO();
        dto.setTicketQuantity(1);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void processPayment_totalPriceNulo_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setTotalPrice(null);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_totalPriceCero_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());
        PaymentCreateDTO dto = validDTO();
        dto.setTotalPrice(BigDecimal.ZERO);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void processPayment_totalPriceNegativo_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setTotalPrice(new BigDecimal("-1.00"));

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_paymentMethodNulo_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod(null);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_paymentMethodInvalido_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod("BITCOIN");

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_paymentMethodMinusculas_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod("credit_card");

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_paymentMethodDebitCard_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod("DEBIT_CARD");

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void processPayment_paymentMethodPaypal_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod("PAYPAL");
        dto.setCardNumber(null);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void processPayment_paymentMethodBankTransfer_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod("BANK_TRANSFER");
        dto.setCardNumber(null);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    // ─── ticketQuantity – valores límite ────────────────────────────────────
    // @Min(1): límite inferior inválido=0, límite inferior válido=1
    // ya cubiertos arriba; agregamos: negativo y valor típico alto

    @Test
    void processPayment_ticketQuantityNegativo_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setTicketQuantity(-1);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_ticketQuantityGrande_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());
        PaymentCreateDTO dto = validDTO();
        dto.setTicketQuantity(1000);

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    // ─── totalPrice – valores límite ────────────────────────────────────────
    // @Min(0): -1 inválido (ya cubierto), 0 válido (ya cubierto)
    // agregamos: valor típico positivo y valor mínimo exacto del límite inferior

    @Test
    void processPayment_totalPriceUnCentavo_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());
        PaymentCreateDTO dto = validDTO();
        dto.setTotalPrice(new BigDecimal("0.01"));

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    @Test
    void processPayment_totalPriceMuyGrande_retorna201() throws Exception {
        when(paymentService.processPayment(any())).thenReturn(approvedResponse());
        PaymentCreateDTO dto = validDTO();
        dto.setTotalPrice(new BigDecimal("99999.99"));

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    // ─── paymentMethod – clases de equivalencia adicionales ─────────────────
    // CE válida: exactamente los 4 valores del regex
    // CE inválida: valor con espacios, vacío, prefijo parcial

    @Test
    void processPayment_paymentMethodConEspacio_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod("CREDIT CARD");

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_paymentMethodParcial_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod("CREDIT");

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processPayment_paymentMethodVacio_retorna400() throws Exception {
        PaymentCreateDTO dto = validDTO();
        dto.setPaymentMethod("");

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // ─── GET /api/payments/{id} ──────────────────────────────────────────────

    @Test
    void getPaymentById_existente_retorna200() throws Exception {
        when(paymentService.getPaymentById(1L)).thenReturn(approvedResponse());

        mockMvc.perform(get("/api/payments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId").value(1L));
    }

    @Test
    void getPaymentById_noExistente_lanzaRuntimeException() {
        when(paymentService.getPaymentById(999L))
                .thenThrow(new RuntimeException("Payment not found with ID: 999"));

        assertThatThrownBy(() -> mockMvc.perform(get("/api/payments/999")))
                .hasMessageContaining("Payment not found with ID: 999");
    }

    // ─── GET /api/payments ───────────────────────────────────────────────────

    @Test
    void getAllPayments_retorna200ConLista() throws Exception {
        when(paymentService.getAllPayments()).thenReturn(List.of(approvedResponse()));

        mockMvc.perform(get("/api/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].paymentId").value(1L));
    }

    @Test
    void getAllPayments_listaVacia_retorna200() throws Exception {
        when(paymentService.getAllPayments()).thenReturn(List.of());

        mockMvc.perform(get("/api/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ─── GET /api/payments/user/{userId} ────────────────────────────────────

    @Test
    void getPaymentsByUserId_existente_retorna200() throws Exception {
        when(paymentService.getPaymentsByUserId(1L)).thenReturn(List.of(approvedResponse()));

        mockMvc.perform(get("/api/payments/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(1L));
    }

    @Test
    void getPaymentsByUserId_sinPagos_retorna200ListaVacia() throws Exception {
        when(paymentService.getPaymentsByUserId(99L)).thenReturn(List.of());

        mockMvc.perform(get("/api/payments/user/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ─── GET /api/payments/event/{eventId} ──────────────────────────────────

    @Test
    void getPaymentsByEventId_existente_retorna200() throws Exception {
        when(paymentService.getPaymentsByEventId(1L)).thenReturn(List.of(approvedResponse()));

        mockMvc.perform(get("/api/payments/event/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventId").value(1L));
    }

    @Test
    void getPaymentsByEventId_sinPagos_retorna200ListaVacia() throws Exception {
        when(paymentService.getPaymentsByEventId(99L)).thenReturn(List.of());

        mockMvc.perform(get("/api/payments/event/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ─── GET /api/payments/booking/{bookingId} ───────────────────────────────

    @Test
    void getPaymentsByBookingId_existente_retorna200() throws Exception {
        when(paymentService.getPaymentsByBookingId(1L)).thenReturn(List.of(approvedResponse()));

        mockMvc.perform(get("/api/payments/booking/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookingId").value(1L));
    }

    @Test
    void getPaymentsByBookingId_sinPagos_retorna200ListaVacia() throws Exception {
        when(paymentService.getPaymentsByBookingId(99L)).thenReturn(List.of());

        mockMvc.perform(get("/api/payments/booking/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ─── GET /api/payments/status/{status} ──────────────────────────────────

    @Test
    void getPaymentsByStatus_aprobados_retorna200() throws Exception {
        when(paymentService.getPaymentsByStatus("APPROVED")).thenReturn(List.of(approvedResponse()));

        mockMvc.perform(get("/api/payments/status/APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("APPROVED"));
    }

    @Test
    void getPaymentsByStatus_sinResultados_retorna200ListaVacia() throws Exception {
        when(paymentService.getPaymentsByStatus("PENDING")).thenReturn(List.of());

        mockMvc.perform(get("/api/payments/status/PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ─── GET /api/payments/health ────────────────────────────────────────────

    @Test
    void healthCheck_retorna200ConMensaje() throws Exception {
        mockMvc.perform(get("/api/payments/health"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.emptyOrNullString())));
    }
}
