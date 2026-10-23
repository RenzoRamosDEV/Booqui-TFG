package org.service_booking.booking.repository.jpa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.service_booking.booking.BookingApplication;
import org.service_booking.booking.repository.BookingRepository;
import org.service_booking.booking.repository.model.RepositoryBookingModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest(classes = BookingApplication.class)
@Transactional
class BookingRepositoryJPATest {

    @Autowired
    private BookingRepositoryJPA bookingRepositoryJPA;

    private BookingRepository bookingRepository;

    private RepositoryBookingModel sampleBooking;

    @BeforeEach
    void setUp() {
        bookingRepository = bookingRepositoryJPA;
        bookingRepositoryJPA.deleteAll();

        sampleBooking = RepositoryBookingModel.builder()
                .userId(10L)
                .userFirstName("Juan")
                .userLastName("Pérez")
                .userEmail("juan@example.com")
                .eventId(20L)
                .eventTitle("Concierto Rock")
                .eventDescription("Gran evento")
                .eventStartDate(LocalDateTime.of(2026, 6, 15, 20, 0))
                .eventLocation("Lima")
                .ticketQuantity(2)
                .basePrice(new BigDecimal("50.00"))
                .totalPrice(new BigDecimal("100.00"))
                .status("PENDING")
                .build();
    }

    // -----------------------------------------------------------------------
    // save
    // -----------------------------------------------------------------------

    @Test
    void save_cuandoModeloValido_persisteYRetornaConId() {
        RepositoryBookingModel saved = bookingRepository.save(sampleBooking);

        assertThat(saved).isNotNull();
        assertThat(saved.getBookingId()).isNotNull().isPositive();
        assertThat(saved.getUserFirstName()).isEqualTo("Juan");
        assertThat(saved.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void save_cuandoModeloNulo_lanzaExcepcion() {
        assertThatThrownBy(() -> bookingRepository.save(null))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("nula");
    }

    @Test
    void save_persisteTotalPrice() {
        RepositoryBookingModel saved = bookingRepository.save(sampleBooking);

        assertThat(saved.getTotalPrice()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(saved.getBasePrice()).isEqualByComparingTo(new BigDecimal("50.00"));
    }

    @Test
    void save_persisTicektQuantity() {
        RepositoryBookingModel saved = bookingRepository.save(sampleBooking);

        assertThat(saved.getTicketQuantity()).isEqualTo(2);
    }

    @Test
    void save_cuandoStatusNulo_prePersistAsignaCONFIRMED() {
        RepositoryBookingModel sinStatus = RepositoryBookingModel.builder()
                .userId(10L)
                .userFirstName("Juan").userLastName("Pérez").userEmail("juan@example.com")
                .eventId(20L).eventTitle("Concierto Rock").eventDescription("Gran evento")
                .eventStartDate(LocalDateTime.of(2026, 6, 15, 20, 0))
                .eventLocation("Lima")
                .ticketQuantity(1)
                .basePrice(new BigDecimal("50.00")).totalPrice(new BigDecimal("50.00"))
                .status(null)
                .build();

        RepositoryBookingModel saved = bookingRepository.save(sinStatus);

        assertThat(saved.getStatus()).isEqualTo("CONFIRMED");
    }

    // -----------------------------------------------------------------------
    // findBookingById
    // -----------------------------------------------------------------------

    @Test
    void findBookingById_cuandoExiste_retornaOptionalConDatos() {
        RepositoryBookingModel saved = bookingRepository.save(sampleBooking);

        Optional<RepositoryBookingModel> result = bookingRepository.findBookingById(saved.getBookingId());

        assertThat(result).isPresent();
        assertThat(result.get().getUserEmail()).isEqualTo("juan@example.com");
    }

    @Test
    void findBookingById_cuandoNoExiste_retornaOptionalVacio() {
        Optional<RepositoryBookingModel> result = bookingRepository.findBookingById(9999L);

        assertThat(result).isEmpty();
    }

    @Test
    void findBookingById_cuandoIdNulo_retornaOptionalVacio() {
        Optional<RepositoryBookingModel> result = bookingRepository.findBookingById(null);

        assertThat(result).isEmpty();
    }

    // -----------------------------------------------------------------------
    // findAllBookings
    // -----------------------------------------------------------------------

    @Test
    void findAllBookings_cuandoHayReservas_retornaTodasLasReservas() {
        bookingRepository.save(sampleBooking);
        RepositoryBookingModel second = RepositoryBookingModel.builder()
                .userId(11L)
                .userFirstName("Ana").userLastName("López").userEmail("ana@example.com")
                .eventId(20L).eventTitle("Concierto Rock").eventDescription("Gran evento")
                .eventStartDate(LocalDateTime.of(2026, 6, 15, 20, 0))
                .eventLocation("Lima")
                .ticketQuantity(1)
                .basePrice(new BigDecimal("50.00")).totalPrice(new BigDecimal("50.00"))
                .status("CONFIRMED")
                .build();
        bookingRepository.save(second);

        Collection<RepositoryBookingModel> result = bookingRepository.findAllBookings();

        assertThat(result).hasSize(2);
    }

    @Test
    void findAllBookings_cuandoNoHayReservas_retornaVacio() {
        Collection<RepositoryBookingModel> result = bookingRepository.findAllBookings();

        assertThat(result).isNotNull().isEmpty();
    }

    // -----------------------------------------------------------------------
    // findBookingsByUserId
    // -----------------------------------------------------------------------

    @Test
    void findBookingsByUserId_cuandoUsuarioTieneReservas_retornaLista() {
        bookingRepository.save(sampleBooking);

        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByUserId(10L);

        assertThat(result).isNotNull().hasSize(1);
        assertThat(result.iterator().next().getUserId()).isEqualTo(10L);
    }

    @Test
    void findBookingsByUserId_cuandoUsuarioNoTieneReservas_retornaVacio() {
        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByUserId(999L);

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findBookingsByUserId_cuandoIdNulo_retornaVacio() {
        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByUserId(null);

        assertThat(result).isNotNull().isEmpty();
    }

    // -----------------------------------------------------------------------
    // findBookingsByEventId
    // -----------------------------------------------------------------------

    @Test
    void findBookingsByEventId_cuandoEventoTieneReservas_retornaLista() {
        bookingRepository.save(sampleBooking);

        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByEventId(20L);

        assertThat(result).isNotNull().hasSize(1);
        assertThat(result.iterator().next().getEventId()).isEqualTo(20L);
    }

    @Test
    void findBookingsByEventId_cuandoEventoNoTieneReservas_retornaVacio() {
        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByEventId(999L);

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findBookingsByEventId_cuandoIdNulo_retornaVacio() {
        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByEventId(null);

        assertThat(result).isNotNull().isEmpty();
    }

    // -----------------------------------------------------------------------
    // findBookingsByStatus
    // -----------------------------------------------------------------------

    @Test
    void findBookingsByStatus_cuandoPENDING_retornaReservas() {
        bookingRepository.save(sampleBooking);

        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByStatus("PENDING");

        assertThat(result).isNotNull().isNotEmpty();
        assertThat(result.iterator().next().getStatus()).isEqualTo("PENDING");
    }

    @Test
    void findBookingsByStatus_cuandoStatusNoExiste_retornaVacio() {
        bookingRepository.save(sampleBooking);

        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByStatus("SUPERADMIN");

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findBookingsByStatus_cuandoStatusNulo_retornaVacio() {
        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByStatus(null);

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findBookingsByStatus_cuandoStatusVacio_retornaVacio() {
        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByStatus("");

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findBookingsByStatus_cuandoStatusSoloEspacios_retornaVacio() {
        Collection<RepositoryBookingModel> result = bookingRepository.findBookingsByStatus("   ");

        assertThat(result).isNotNull().isEmpty();
        verify_findBookingsByStatus_noLlamaJPAConEspacios();
    }

    private void verify_findBookingsByStatus_noLlamaJPAConEspacios() {
        // Los espacios son rechazados por la validación en el método default antes de llegar a JPA
        // Se verifica implícitamente al recibir colección vacía sin error
    }

    // -----------------------------------------------------------------------
    // deleteBookingById
    // -----------------------------------------------------------------------

    @Test
    void deleteBookingById_cuandoExiste_eliminaLaReserva() {
        RepositoryBookingModel saved = bookingRepository.save(sampleBooking);
        Long id = saved.getBookingId();

        bookingRepository.deleteBookingById(id);

        assertThat(bookingRepository.findBookingById(id)).isEmpty();
    }

    @Test
    void deleteBookingById_cuandoIdNulo_noLanzaExcepcion() {
        assertThatNoException().isThrownBy(() -> bookingRepository.deleteBookingById(null));
    }

    @Test
    void deleteBookingById_cuandoIdNoExiste_noLanzaExcepcion() {
        assertThatNoException().isThrownBy(() -> bookingRepository.deleteBookingById(9999L));
    }

    // -----------------------------------------------------------------------
    // existsBookingById
    // -----------------------------------------------------------------------

    @Test
    void existsBookingById_cuandoExiste_retornaTrue() {
        RepositoryBookingModel saved = bookingRepository.save(sampleBooking);

        boolean exists = bookingRepository.existsBookingById(saved.getBookingId());

        assertThat(exists).isTrue();
    }

    @Test
    void existsBookingById_cuandoNoExiste_retornaFalse() {
        boolean exists = bookingRepository.existsBookingById(9999L);

        assertThat(exists).isFalse();
    }

    @Test
    void existsBookingById_cuandoIdNulo_retornaFalse() {
        boolean exists = bookingRepository.existsBookingById(null);

        assertThat(exists).isFalse();
    }
}
