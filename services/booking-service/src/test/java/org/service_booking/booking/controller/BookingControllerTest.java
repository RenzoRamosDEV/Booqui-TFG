package org.service_booking.booking.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.service_booking.booking.service.BookingService;
import org.service_booking.booking.service.model.BookingCreateDTO;
import org.service_booking.booking.service.model.BookingResponseDTO;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController bookingController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private BookingResponseDTO sampleResponse;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(bookingController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        sampleResponse = BookingResponseDTO.builder()
                .bookingId(1L)
                .userId(10L)
                .userFirstName("Juan")
                .userLastName("Pérez")
                .userEmail("juan@example.com")
                .eventId(20L)
                .eventTitle("Concierto Rock")
                .eventStartDate(LocalDateTime.of(2026, 6, 15, 20, 0))
                .eventLocation("Lima")
                .ticketQuantity(2)
                .basePrice(new BigDecimal("50.00"))
                .totalPrice(new BigDecimal("100.00"))
                .purchaseDate(LocalDateTime.now())
                .status("PENDING")
                .build();
    }

    // -----------------------------------------------------------------------
    // POST /api/bookings - createBooking
    // -----------------------------------------------------------------------

    @Test
    void createBooking_cuandoDatosValidos_retorna201() throws Exception {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L)
                .eventId(20L)
                .ticketQuantity(2)
                .build();

        when(bookingService.createBooking(any(BookingCreateDTO.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingId").value(1L))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalPrice").value(100.00));
    }

    @Test
    void createBooking_cuandoUserIdNulo_retorna400() throws Exception {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(null)
                .eventId(20L)
                .ticketQuantity(2)
                .build();

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());

        verify(bookingService, never()).createBooking(any());
    }

    @Test
    void createBooking_cuandoEventIdNulo_retorna400() throws Exception {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L)
                .eventId(null)
                .ticketQuantity(2)
                .build();

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());

        verify(bookingService, never()).createBooking(any());
    }

    @Test
    void createBooking_cuandoTicketQuantityNulo_retorna400() throws Exception {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L)
                .eventId(20L)
                .ticketQuantity(null)
                .build();

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());

        verify(bookingService, never()).createBooking(any());
    }

    @Test
    void createBooking_cuandoTicketQuantityCero_retorna400() throws Exception {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L)
                .eventId(20L)
                .ticketQuantity(0)
                .build();

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());

        verify(bookingService, never()).createBooking(any());
    }

    @Test
    void createBooking_cuandoTicketQuantityNegativo_retorna400() throws Exception {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L)
                .eventId(20L)
                .ticketQuantity(-1)
                .build();

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());

        verify(bookingService, never()).createBooking(any());
    }

    @Test
    void createBooking_cuandoTicketQuantityUno_limiteInferiorValido_retorna201() throws Exception {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L)
                .eventId(20L)
                .ticketQuantity(1)
                .build();

        when(bookingService.createBooking(any(BookingCreateDTO.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());
    }

    // -----------------------------------------------------------------------
    // GET /api/bookings/{id} - getBookingById
    // -----------------------------------------------------------------------

    @Test
    void getBookingById_cuandoExiste_retorna200() throws Exception {
        when(bookingService.getBookingById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/bookings/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(1L))
                .andExpect(jsonPath("$.userFirstName").value("Juan"));
    }

    // -----------------------------------------------------------------------
    // GET /api/bookings - getAllBookings
    // -----------------------------------------------------------------------

    @Test
    void getAllBookings_retorna200ConLista() throws Exception {
        Collection<BookingResponseDTO> bookings = List.of(sampleResponse);
        when(bookingService.getAllBookings()).thenReturn(bookings);

        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookingId").value(1L));
    }

    @Test
    void getAllBookings_cuandoListaVacia_retorna200() throws Exception {
        when(bookingService.getAllBookings()).thenReturn(List.of());

        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -----------------------------------------------------------------------
    // GET /api/bookings/user/{userId} - getBookingsByUserId
    // -----------------------------------------------------------------------

    @Test
    void getBookingsByUserId_retorna200() throws Exception {
        when(bookingService.getBookingsByUserId(10L)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/bookings/user/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(10L));
    }

    @Test
    void getBookingsByUserId_cuandoNoTieneReservas_retorna200ListaVacia() throws Exception {
        when(bookingService.getBookingsByUserId(99L)).thenReturn(List.of());

        mockMvc.perform(get("/api/bookings/user/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -----------------------------------------------------------------------
    // GET /api/bookings/event/{eventId} - getBookingsByEventId
    // -----------------------------------------------------------------------

    @Test
    void getBookingsByEventId_retorna200() throws Exception {
        when(bookingService.getBookingsByEventId(20L)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/bookings/event/20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventId").value(20L));
    }

    @Test
    void getBookingsByEventId_cuandoNoHayReservas_retorna200ListaVacia() throws Exception {
        when(bookingService.getBookingsByEventId(99L)).thenReturn(List.of());

        mockMvc.perform(get("/api/bookings/event/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -----------------------------------------------------------------------
    // GET /api/bookings/status/{status} - getBookingsByStatus
    // -----------------------------------------------------------------------

    @Test
    void getBookingsByStatus_cuandoPENDING_retorna200() throws Exception {
        when(bookingService.getBookingsByStatus("PENDING")).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/bookings/status/PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void getBookingsByStatus_cuandoCONFIRMED_retorna200() throws Exception {
        BookingResponseDTO confirmed = BookingResponseDTO.builder()
                .bookingId(2L).status("CONFIRMED").build();
        when(bookingService.getBookingsByStatus("CONFIRMED")).thenReturn(List.of(confirmed));

        mockMvc.perform(get("/api/bookings/status/CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
    }

    @Test
    void getBookingsByStatus_cuandoCANCELLED_retorna200() throws Exception {
        when(bookingService.getBookingsByStatus("CANCELLED")).thenReturn(List.of());

        mockMvc.perform(get("/api/bookings/status/CANCELLED"))
                .andExpect(status().isOk());
    }

    // -----------------------------------------------------------------------
    // GET /api/bookings/health - healthCheck
    // -----------------------------------------------------------------------

    @Test
    void healthCheck_retorna200() throws Exception {
        mockMvc.perform(get("/api/bookings/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("\"Booking Service está activo\""));
    }

    // -----------------------------------------------------------------------
    // PATCH /api/bookings/{id}/confirm - confirmBooking
    // -----------------------------------------------------------------------

    @Test
    void confirmBooking_cuandoExiste_retorna200() throws Exception {
        doNothing().when(bookingService).confirmBooking(1L);

        mockMvc.perform(patch("/api/bookings/1/confirm"))
                .andExpect(status().isOk());

        verify(bookingService).confirmBooking(1L);
    }

    // -----------------------------------------------------------------------
    // PATCH /api/bookings/{id}/cancel - cancelBooking
    // -----------------------------------------------------------------------

    @Test
    void cancelBooking_cuandoExiste_retorna200() throws Exception {
        doNothing().when(bookingService).cancelBooking(1L);

        mockMvc.perform(patch("/api/bookings/1/cancel"))
                .andExpect(status().isOk());

        verify(bookingService).cancelBooking(1L);
    }

    @Test
    void confirmBooking_verificaLlamadaAlServicio() throws Exception {
        doNothing().when(bookingService).confirmBooking(anyLong());

        mockMvc.perform(patch("/api/bookings/5/confirm"))
                .andExpect(status().isOk());

        verify(bookingService, times(1)).confirmBooking(5L);
    }

    @Test
    void cancelBooking_verificaLlamadaAlServicio() throws Exception {
        doNothing().when(bookingService).cancelBooking(anyLong());

        mockMvc.perform(patch("/api/bookings/5/cancel"))
                .andExpect(status().isOk());

        verify(bookingService, times(1)).cancelBooking(5L);
    }
}
