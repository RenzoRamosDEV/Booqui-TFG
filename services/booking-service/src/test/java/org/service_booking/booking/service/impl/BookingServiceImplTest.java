package org.service_booking.booking.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.service_booking.booking.client.EventServiceClient;
import org.service_booking.booking.client.UserServiceClient;
import org.service_booking.booking.repository.BookingRepository;
import org.service_booking.booking.repository.model.RepositoryBookingModel;
import org.service_booking.booking.service.model.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private EventServiceClient eventServiceClient;

    @Mock
    private ServiceBookingMapper serviceBookingMapper;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private UserResponseDTO sampleUser;
    private EventResponseDTO sampleEvent;
    private RepositoryBookingModel savedModel;
    private BookingResponseDTO sampleResponse;

    @BeforeEach
    void setUp() {
        sampleUser = UserResponseDTO.builder()
                .idUser(10L)
                .firstName("Juan")
                .lastName("Pérez")
                .contactEmail("juan@example.com")
                .role("CUSTOMER")
                .build();

        sampleEvent = EventResponseDTO.builder()
                .idEvent(20L)
                .title("Concierto Rock")
                .description("Gran concierto")
                .startDate(LocalDateTime.of(2026, 6, 15, 20, 0))
                .location("Lima")
                .price(50.0)
                .build();

        savedModel = RepositoryBookingModel.builder()
                .bookingId(1L)
                .userId(10L)
                .eventId(20L)
                .status("PENDING")
                .ticketQuantity(2)
                .basePrice(new BigDecimal("50.00"))
                .totalPrice(new BigDecimal("100.00"))
                .build();

        sampleResponse = BookingResponseDTO.builder()
                .bookingId(1L)
                .userId(10L)
                .eventId(20L)
                .status("PENDING")
                .totalPrice(new BigDecimal("100.00"))
                .build();
    }

    // -----------------------------------------------------------------------
    // createBooking
    // -----------------------------------------------------------------------

    @Test
    void createBooking_cuandoDatosValidos_retornaDTO() {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L).eventId(20L).ticketQuantity(2).build();

        when(userServiceClient.getUserById(10L)).thenReturn(sampleUser);
        when(eventServiceClient.getEventById(20L)).thenReturn(sampleEvent);
        when(bookingRepository.save(any(RepositoryBookingModel.class))).thenReturn(savedModel);
        when(serviceBookingMapper.toResponseDTO(savedModel)).thenReturn(sampleResponse);

        BookingResponseDTO result = bookingService.createBooking(dto);

        assertThat(result).isNotNull();
        assertThat(result.getBookingId()).isEqualTo(1L);
        assertThat(result.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void createBooking_calculaTotalPrecioCorrectamente() {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L).eventId(20L).ticketQuantity(3).build();

        when(userServiceClient.getUserById(10L)).thenReturn(sampleUser);
        when(eventServiceClient.getEventById(20L)).thenReturn(sampleEvent);

        ArgumentCaptor<RepositoryBookingModel> captor = ArgumentCaptor.forClass(RepositoryBookingModel.class);
        when(bookingRepository.save(captor.capture())).thenReturn(savedModel);
        when(serviceBookingMapper.toResponseDTO(savedModel)).thenReturn(sampleResponse);

        bookingService.createBooking(dto);

        RepositoryBookingModel captured = captor.getValue();
        // price=50.0, quantity=3 → total=150.00
        assertThat(captured.getTotalPrice()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(captured.getBasePrice()).isEqualByComparingTo(new BigDecimal("50.00"));
    }

    @Test
    void createBooking_snapshotContieneStatusPENDING() {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L).eventId(20L).ticketQuantity(1).build();

        when(userServiceClient.getUserById(10L)).thenReturn(sampleUser);
        when(eventServiceClient.getEventById(20L)).thenReturn(sampleEvent);

        ArgumentCaptor<RepositoryBookingModel> captor = ArgumentCaptor.forClass(RepositoryBookingModel.class);
        when(bookingRepository.save(captor.capture())).thenReturn(savedModel);
        when(serviceBookingMapper.toResponseDTO(savedModel)).thenReturn(sampleResponse);

        bookingService.createBooking(dto);

        assertThat(captor.getValue().getStatus()).isEqualTo("PENDING");
    }

    @Test
    void createBooking_snapshotContieneDataDelUsuario() {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L).eventId(20L).ticketQuantity(1).build();

        when(userServiceClient.getUserById(10L)).thenReturn(sampleUser);
        when(eventServiceClient.getEventById(20L)).thenReturn(sampleEvent);

        ArgumentCaptor<RepositoryBookingModel> captor = ArgumentCaptor.forClass(RepositoryBookingModel.class);
        when(bookingRepository.save(captor.capture())).thenReturn(savedModel);
        when(serviceBookingMapper.toResponseDTO(savedModel)).thenReturn(sampleResponse);

        bookingService.createBooking(dto);

        RepositoryBookingModel captured = captor.getValue();
        assertThat(captured.getUserId()).isEqualTo(10L);
        assertThat(captured.getUserFirstName()).isEqualTo("Juan");
        assertThat(captured.getUserLastName()).isEqualTo("Pérez");
        assertThat(captured.getUserEmail()).isEqualTo("juan@example.com");
    }

    @Test
    void createBooking_snapshotContieneDataDelEvento() {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L).eventId(20L).ticketQuantity(1).build();

        when(userServiceClient.getUserById(10L)).thenReturn(sampleUser);
        when(eventServiceClient.getEventById(20L)).thenReturn(sampleEvent);

        ArgumentCaptor<RepositoryBookingModel> captor = ArgumentCaptor.forClass(RepositoryBookingModel.class);
        when(bookingRepository.save(captor.capture())).thenReturn(savedModel);
        when(serviceBookingMapper.toResponseDTO(savedModel)).thenReturn(sampleResponse);

        bookingService.createBooking(dto);

        RepositoryBookingModel captured = captor.getValue();
        assertThat(captured.getEventId()).isEqualTo(20L);
        assertThat(captured.getEventTitle()).isEqualTo("Concierto Rock");
        assertThat(captured.getEventLocation()).isEqualTo("Lima");
    }

    @Test
    void createBooking_cuandoUserServiceFalla_propagaExcepcion() {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(99L).eventId(20L).ticketQuantity(1).build();

        when(userServiceClient.getUserById(99L))
                .thenThrow(new RuntimeException("Error al obtener usuario con ID: 99"));

        assertThatThrownBy(() -> bookingService.createBooking(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("99");

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_cuandoEventServiceFalla_propagaExcepcion() {
        BookingCreateDTO dto = BookingCreateDTO.builder()
                .userId(10L).eventId(99L).ticketQuantity(1).build();

        when(userServiceClient.getUserById(10L)).thenReturn(sampleUser);
        when(eventServiceClient.getEventById(99L))
                .thenThrow(new RuntimeException("Error al obtener evento con ID: 99"));

        assertThatThrownBy(() -> bookingService.createBooking(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("99");

        verify(bookingRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // getBookingById
    // -----------------------------------------------------------------------

    @Test
    void getBookingById_cuandoExiste_retornaDTO() {
        when(bookingRepository.findBookingById(1L)).thenReturn(Optional.of(savedModel));
        when(serviceBookingMapper.toResponseDTO(savedModel)).thenReturn(sampleResponse);

        BookingResponseDTO result = bookingService.getBookingById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getBookingId()).isEqualTo(1L);
    }

    @Test
    void getBookingById_cuandoNoExiste_lanzaExcepcion() {
        when(bookingRepository.findBookingById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.getBookingById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("99");
    }

    // -----------------------------------------------------------------------
    // getAllBookings
    // -----------------------------------------------------------------------

    @Test
    void getAllBookings_retornaColeccion() {
        Collection<RepositoryBookingModel> models = List.of(savedModel);
        when(bookingRepository.findAllBookings()).thenReturn(models);
        when(serviceBookingMapper.toResponseDTOList(models)).thenReturn(List.of(sampleResponse));

        Collection<BookingResponseDTO> result = bookingService.getAllBookings();

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getAllBookings_cuandoNoHayReservas_retornaColeccionVacia() {
        when(bookingRepository.findAllBookings()).thenReturn(List.of());
        when(serviceBookingMapper.toResponseDTOList(List.of())).thenReturn(List.of());

        Collection<BookingResponseDTO> result = bookingService.getAllBookings();

        assertThat(result).isNotNull().isEmpty();
    }

    // -----------------------------------------------------------------------
    // getBookingsByUserId
    // -----------------------------------------------------------------------

    @Test
    void getBookingsByUserId_retornaReservasDelUsuario() {
        Collection<RepositoryBookingModel> models = List.of(savedModel);
        when(bookingRepository.findBookingsByUserId(10L)).thenReturn(models);
        when(serviceBookingMapper.toResponseDTOList(models)).thenReturn(List.of(sampleResponse));

        Collection<BookingResponseDTO> result = bookingService.getBookingsByUserId(10L);

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getBookingsByUserId_cuandoNoTieneReservas_retornaVacio() {
        when(bookingRepository.findBookingsByUserId(99L)).thenReturn(List.of());
        when(serviceBookingMapper.toResponseDTOList(List.of())).thenReturn(List.of());

        Collection<BookingResponseDTO> result = bookingService.getBookingsByUserId(99L);

        assertThat(result).isNotNull().isEmpty();
    }

    // -----------------------------------------------------------------------
    // getBookingsByEventId
    // -----------------------------------------------------------------------

    @Test
    void getBookingsByEventId_retornaReservasDelEvento() {
        Collection<RepositoryBookingModel> models = List.of(savedModel);
        when(bookingRepository.findBookingsByEventId(20L)).thenReturn(models);
        when(serviceBookingMapper.toResponseDTOList(models)).thenReturn(List.of(sampleResponse));

        Collection<BookingResponseDTO> result = bookingService.getBookingsByEventId(20L);

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getBookingsByEventId_cuandoNoHayReservas_retornaVacio() {
        when(bookingRepository.findBookingsByEventId(99L)).thenReturn(List.of());
        when(serviceBookingMapper.toResponseDTOList(List.of())).thenReturn(List.of());

        Collection<BookingResponseDTO> result = bookingService.getBookingsByEventId(99L);

        assertThat(result).isNotNull().isEmpty();
    }

    // -----------------------------------------------------------------------
    // getBookingsByStatus
    // -----------------------------------------------------------------------

    @Test
    void getBookingsByStatus_cuandoPENDING_retornaReservas() {
        Collection<RepositoryBookingModel> models = List.of(savedModel);
        when(bookingRepository.findBookingsByStatus("PENDING")).thenReturn(models);
        when(serviceBookingMapper.toResponseDTOList(models)).thenReturn(List.of(sampleResponse));

        Collection<BookingResponseDTO> result = bookingService.getBookingsByStatus("PENDING");

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getBookingsByStatus_cuandoStatusInexistente_retornaVacio() {
        when(bookingRepository.findBookingsByStatus("INEXISTENTE")).thenReturn(List.of());
        when(serviceBookingMapper.toResponseDTOList(List.of())).thenReturn(List.of());

        Collection<BookingResponseDTO> result = bookingService.getBookingsByStatus("INEXISTENTE");

        assertThat(result).isNotNull().isEmpty();
    }

    // -----------------------------------------------------------------------
    // confirmBooking
    // -----------------------------------------------------------------------

    @Test
    void confirmBooking_cuandoReservaEnPENDING_cambiaACONFIRMED() {
        RepositoryBookingModel pending = RepositoryBookingModel.builder()
                .bookingId(1L).status("PENDING").build();
        when(bookingRepository.findBookingById(1L)).thenReturn(Optional.of(pending));
        when(bookingRepository.save(any())).thenReturn(pending);

        bookingService.confirmBooking(1L);

        ArgumentCaptor<RepositoryBookingModel> captor = ArgumentCaptor.forClass(RepositoryBookingModel.class);
        verify(bookingRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    void confirmBooking_cuandoYaEstaConfirmada_noGuardaNuevamente() {
        RepositoryBookingModel confirmed = RepositoryBookingModel.builder()
                .bookingId(1L).status("CONFIRMED").build();
        when(bookingRepository.findBookingById(1L)).thenReturn(Optional.of(confirmed));

        bookingService.confirmBooking(1L);

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void confirmBooking_cuandoNoExiste_lanzaExcepcion() {
        when(bookingRepository.findBookingById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.confirmBooking(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("99");

        verify(bookingRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // cancelBooking
    // -----------------------------------------------------------------------

    @Test
    void cancelBooking_cuandoReservaEnPENDING_cambiaACANCELLED() {
        RepositoryBookingModel pending = RepositoryBookingModel.builder()
                .bookingId(1L).status("PENDING").build();
        when(bookingRepository.findBookingById(1L)).thenReturn(Optional.of(pending));
        when(bookingRepository.save(any())).thenReturn(pending);

        bookingService.cancelBooking(1L);

        ArgumentCaptor<RepositoryBookingModel> captor = ArgumentCaptor.forClass(RepositoryBookingModel.class);
        verify(bookingRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void cancelBooking_cuandoYaEstaCancelada_noGuardaNuevamente() {
        RepositoryBookingModel cancelled = RepositoryBookingModel.builder()
                .bookingId(1L).status("CANCELLED").build();
        when(bookingRepository.findBookingById(1L)).thenReturn(Optional.of(cancelled));

        bookingService.cancelBooking(1L);

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBooking_cuandoNoExiste_lanzaExcepcion() {
        when(bookingRepository.findBookingById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.cancelBooking(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("99");

        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBooking_cuandoReservaConfirmada_cambiaACANCELLED() {
        RepositoryBookingModel confirmed = RepositoryBookingModel.builder()
                .bookingId(1L).status("CONFIRMED").build();
        when(bookingRepository.findBookingById(1L)).thenReturn(Optional.of(confirmed));
        when(bookingRepository.save(any())).thenReturn(confirmed);

        bookingService.cancelBooking(1L);

        ArgumentCaptor<RepositoryBookingModel> captor = ArgumentCaptor.forClass(RepositoryBookingModel.class);
        verify(bookingRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("CANCELLED");
    }
}
