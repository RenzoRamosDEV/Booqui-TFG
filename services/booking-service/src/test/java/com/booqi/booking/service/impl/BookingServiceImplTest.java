package com.booqi.booking.service.impl;

import com.booqi.booking.client.EventClient;
import com.booqi.booking.client.UserClient;
import com.booqi.booking.client.dto.EventResponse;
import com.booqi.booking.client.dto.UserResponse;
import com.booqi.booking.dto.request.BookingFilter;
import com.booqi.booking.dto.request.CreateBookingRequest;
import com.booqi.booking.dto.response.BookingResponse;
import com.booqi.booking.entity.Booking;
import com.booqi.booking.exception.InvalidFilterException;
import com.booqi.booking.exception.RemoteServiceException;
import com.booqi.booking.exception.ResourceNotFoundException;
import com.booqi.booking.mapper.BookingMapper;
import com.booqi.booking.mapper.BookingMapperImpl;
import com.booqi.booking.repository.BookingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 6, 15, 20, 0);

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserClient userClient;

    @Mock
    private EventClient eventClient;

    @Spy
    private BookingMapper bookingMapper = new BookingMapperImpl();

    @InjectMocks
    private BookingServiceImpl bookingService;

    private final UserResponse user = new UserResponse(10L, "Juan", "Pérez", "juan@example.com");
    private final EventResponse event = new EventResponse(20L, "Concierto Rock", "Gran concierto", START, "Lima", 50.0);

    private static Booking booking(long id, String status) {
        return Booking.builder().id(id).userId(10L).eventId(20L).status(status).ticketQuantity(2)
                .basePrice(new BigDecimal("50.00")).totalPrice(new BigDecimal("100.00")).build();
    }

    private void givenRemoteDataAndSave(Long userId, Long eventId) {
        when(userClient.findById(userId)).thenReturn(user);
        when(eventClient.findById(eventId)).thenReturn(event);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b.setId(1L);
            return b;
        });
    }

    private Booking savedBooking() {
        ArgumentCaptor<Booking> captor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(captor.capture());
        return captor.getValue();
    }

    // create

    @Test
    void create_cuandoDatosValidos_retornaReservaPendienteConId() {
        givenRemoteDataAndSave(10L, 20L);

        BookingResponse result = bookingService.create(new CreateBookingRequest(10L, 20L, 2));

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.status()).isEqualTo("PENDING");
        assertThat(result.totalPrice()).isEqualByComparingTo("100.00");
    }

    @Test
    void create_calculaTotalPrecioCorrectamente() {
        givenRemoteDataAndSave(10L, 20L);

        bookingService.create(new CreateBookingRequest(10L, 20L, 3));

        Booking captured = savedBooking();
        assertThat(captured.getTotalPrice()).isEqualByComparingTo("150.00");
        assertThat(captured.getBasePrice()).isEqualByComparingTo("50.00");
        assertThat(captured.getTicketQuantity()).isEqualTo(3);
    }

    @Test
    void create_snapshotContieneStatusPENDING() {
        givenRemoteDataAndSave(10L, 20L);

        bookingService.create(new CreateBookingRequest(10L, 20L, 1));

        assertThat(savedBooking().getStatus()).isEqualTo("PENDING");
    }

    @Test
    void create_snapshotContieneDataDelUsuario() {
        givenRemoteDataAndSave(10L, 20L);

        bookingService.create(new CreateBookingRequest(10L, 20L, 1));

        Booking captured = savedBooking();
        assertThat(captured.getUserId()).isEqualTo(10L);
        assertThat(captured.getUserFirstName()).isEqualTo("Juan");
        assertThat(captured.getUserLastName()).isEqualTo("Pérez");
        assertThat(captured.getUserEmail()).isEqualTo("juan@example.com");
    }

    @Test
    void create_snapshotContieneDataDelEvento() {
        givenRemoteDataAndSave(10L, 20L);

        bookingService.create(new CreateBookingRequest(10L, 20L, 1));

        Booking captured = savedBooking();
        assertThat(captured.getEventId()).isEqualTo(20L);
        assertThat(captured.getEventTitle()).isEqualTo("Concierto Rock");
        assertThat(captured.getEventDescription()).isEqualTo("Gran concierto");
        assertThat(captured.getEventStartDate()).isEqualTo(START);
        assertThat(captured.getEventLocation()).isEqualTo("Lima");
    }

    @Test
    void create_cuandoUsuarioRemotoNoExiste_propagaNotFoundSinGuardarNiConsultarEvento() {
        ResourceNotFoundException remote = new ResourceNotFoundException("User with id 99 not found");
        when(userClient.findById(99L)).thenThrow(remote);

        assertThatThrownBy(() -> bookingService.create(new CreateBookingRequest(99L, 20L, 1))).isSameAs(remote);
        verify(bookingRepository, never()).save(any());
        verifyNoInteractions(eventClient);
    }

    @Test
    void create_cuandoUserServiceNoDisponible_propagaSinGuardarNiConsultarEvento() {
        RemoteServiceException remote = new RemoteServiceException("User service is unavailable");
        when(userClient.findById(10L)).thenThrow(remote);

        assertThatThrownBy(() -> bookingService.create(new CreateBookingRequest(10L, 20L, 1))).isSameAs(remote);
        verify(bookingRepository, never()).save(any());
        verifyNoInteractions(eventClient);
    }

    @Test
    void create_cuandoEventoRemotoNoExiste_propagaNotFoundSinGuardar() {
        ResourceNotFoundException remote = new ResourceNotFoundException("Event with id 99 not found");
        when(userClient.findById(10L)).thenReturn(user);
        when(eventClient.findById(99L)).thenThrow(remote);

        assertThatThrownBy(() -> bookingService.create(new CreateBookingRequest(10L, 99L, 1))).isSameAs(remote);
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void create_cuandoEventServiceNoDisponible_propagaSinGuardar() {
        RemoteServiceException remote = new RemoteServiceException("Event service is unavailable");
        when(userClient.findById(10L)).thenReturn(user);
        when(eventClient.findById(20L)).thenThrow(remote);

        assertThatThrownBy(() -> bookingService.create(new CreateBookingRequest(10L, 20L, 1))).isSameAs(remote);
        verify(bookingRepository, never()).save(any());
    }

    // findById / findAll / existsById

    @Test
    void findById_cuandoExiste_retornaReserva() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking(1L, "PENDING")));

        assertThat(bookingService.findById(1L).id()).isEqualTo(1L);
    }

    @Test
    void findById_cuandoNoExiste_lanzaResourceNotFound() {
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Booking with id 99 not found");
    }

    @Test
    void findAll_retornaTodasMapeadas() {
        when(bookingRepository.findAll()).thenReturn(List.of(booking(1L, "PENDING"), booking(2L, "CONFIRMED")));

        assertThat(bookingService.findAll()).extracting(BookingResponse::id).containsExactly(1L, 2L);
    }

    @Test
    void findAll_cuandoNoHayReservas_retornaVacio() {
        when(bookingRepository.findAll()).thenReturn(List.of());

        assertThat(bookingService.findAll()).isEmpty();
    }

    @Test
    void existsById_reflejaElRepositorio() {
        when(bookingRepository.existsById(1L)).thenReturn(true);
        when(bookingRepository.existsById(2L)).thenReturn(false);

        assertThat(bookingService.existsById(1L)).isTrue();
        assertThat(bookingService.existsById(2L)).isFalse();
    }

    // findBy*

    @Test
    void findByUserId_retornaReservasDelUsuario() {
        when(bookingRepository.findByUserId(10L)).thenReturn(List.of(booking(1L, "PENDING")));

        assertThat(bookingService.findByUserId(10L)).extracting(BookingResponse::id).containsExactly(1L);
    }

    @Test
    void findByEventId_retornaReservasDelEvento() {
        when(bookingRepository.findByEventId(20L)).thenReturn(List.of(booking(1L, "PENDING")));

        assertThat(bookingService.findByEventId(20L)).extracting(BookingResponse::id).containsExactly(1L);
    }

    @Test
    void findByStatus_retornaReservasConEseEstado() {
        when(bookingRepository.findByStatus("PENDING")).thenReturn(List.of(booking(1L, "PENDING")));

        assertThat(bookingService.findByStatus("PENDING")).extracting(BookingResponse::status).containsExactly("PENDING");
    }

    // findAll(BookingFilter)

    @Test
    void findAllFiltro_sinFiltros_retornaTodas() {
        when(bookingRepository.findAll()).thenReturn(List.of(booking(1L, "PENDING")));

        assertThat(bookingService.findAll(new BookingFilter(null, null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_statusEnBlancoSinMasFiltros_retornaTodas() {
        when(bookingRepository.findAll()).thenReturn(List.of(booking(1L, "PENDING")));

        assertThat(bookingService.findAll(new BookingFilter(null, null, " "))).hasSize(1);
        verify(bookingRepository, never()).findByStatus(any());
    }

    @Test
    void findAllFiltro_porUserId() {
        when(bookingRepository.findByUserId(10L)).thenReturn(List.of(booking(1L, "PENDING")));

        assertThat(bookingService.findAll(new BookingFilter(10L, null, null))).extracting(BookingResponse::id)
                .containsExactly(1L);
    }

    @Test
    void findAllFiltro_porEventId() {
        when(bookingRepository.findByEventId(20L)).thenReturn(List.of(booking(2L, "PENDING")));

        assertThat(bookingService.findAll(new BookingFilter(null, 20L, null))).extracting(BookingResponse::id)
                .containsExactly(2L);
    }

    @Test
    void findAllFiltro_porStatus() {
        when(bookingRepository.findByStatus("CANCELLED")).thenReturn(List.of(booking(3L, "CANCELLED")));

        assertThat(bookingService.findAll(new BookingFilter(null, null, "CANCELLED"))).extracting(BookingResponse::id)
                .containsExactly(3L);
    }

    @Test
    void findAllFiltro_statusEnBlancoSeIgnoraJuntoAUserId() {
        when(bookingRepository.findByUserId(10L)).thenReturn(List.of(booking(1L, "PENDING")));

        assertThat(bookingService.findAll(new BookingFilter(10L, null, ""))).hasSize(1);
    }

    static Stream<BookingFilter> paresDeFiltros() {
        return Stream.of(
                new BookingFilter(10L, 20L, null),
                new BookingFilter(10L, null, "PENDING"),
                new BookingFilter(null, 20L, "PENDING"),
                new BookingFilter(10L, 20L, "PENDING"));
    }

    @ParameterizedTest
    @MethodSource("paresDeFiltros")
    void findAllFiltro_variosFiltros_lanzaInvalidFilterSinConsultar(BookingFilter filtro) {
        assertThatThrownBy(() -> bookingService.findAll(filtro))
                .isInstanceOf(InvalidFilterException.class)
                .hasMessage("Only one filter may be used at a time");
        verifyNoInteractions(bookingRepository);
    }

    // confirm

    @Test
    void confirm_cuandoPendiente_cambiaAConfirmedYLaRetorna() {
        Booking pending = booking(1L, "PENDING");
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(bookingRepository.save(pending)).thenReturn(pending);

        BookingResponse result = bookingService.confirm(1L);

        assertThat(result.status()).isEqualTo("CONFIRMED");
        assertThat(savedBooking().getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    void confirm_cuandoYaConfirmada_noGuardaYLaRetorna() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking(1L, "CONFIRMED")));

        assertThat(bookingService.confirm(1L).status()).isEqualTo("CONFIRMED");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void confirm_cuandoCancelada_laConfirma_comportamientoActual() {
        Booking cancelled = booking(1L, "CANCELLED");
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(cancelled));
        when(bookingRepository.save(cancelled)).thenReturn(cancelled);

        assertThat(bookingService.confirm(1L).status()).isEqualTo("CONFIRMED");
    }

    @Test
    void confirm_cuandoNoExiste_lanzaResourceNotFoundSinGuardar() {
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.confirm(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Booking with id 99 not found");
        verify(bookingRepository, never()).save(any());
    }

    // cancel

    @Test
    void cancel_cuandoPendiente_cambiaACancelledYLaRetorna() {
        Booking pending = booking(1L, "PENDING");
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(bookingRepository.save(pending)).thenReturn(pending);

        assertThat(bookingService.cancel(1L).status()).isEqualTo("CANCELLED");
        assertThat(savedBooking().getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void cancel_cuandoConfirmada_cambiaACancelled() {
        Booking confirmed = booking(1L, "CONFIRMED");
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(confirmed));
        when(bookingRepository.save(confirmed)).thenReturn(confirmed);

        assertThat(bookingService.cancel(1L).status()).isEqualTo("CANCELLED");
    }

    @Test
    void cancel_cuandoYaCancelada_noGuardaYLaRetorna() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking(1L, "CANCELLED")));

        assertThat(bookingService.cancel(1L).status()).isEqualTo("CANCELLED");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancel_cuandoNoExiste_lanzaResourceNotFoundSinGuardar() {
        when(bookingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.cancel(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Booking with id 99 not found");
        verify(bookingRepository, never()).save(any());
    }
}
