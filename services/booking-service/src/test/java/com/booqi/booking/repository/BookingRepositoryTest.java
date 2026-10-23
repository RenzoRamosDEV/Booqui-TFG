package com.booqi.booking.repository;

import com.booqi.booking.config.JpaConfig;
import com.booqi.booking.entity.Booking;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(JpaConfig.class)
class BookingRepositoryTest {

    private final BookingRepository bookingRepository;

    BookingRepositoryTest(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
    }

    private static Booking buildBooking(Long userId, String status) {
        return Booking.builder()
                .userId(userId)
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
                .status(status)
                .build();
    }

    @Test
    void save_cuandoModeloValido_persisteYRetornaConId() {
        Booking saved = bookingRepository.save(buildBooking(10L, "PENDING"));

        assertThat(saved.getId()).isNotNull().isPositive();
        assertThat(saved.getUserFirstName()).isEqualTo("Juan");
        assertThat(saved.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void save_rellenaIdYFechasDeAuditoria() {
        Booking saved = bookingRepository.saveAndFlush(buildBooking(10L, "PENDING"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void cambioDeEstado_avanzaUpdatedAtYConservaCreatedAt() throws InterruptedException {
        Booking saved = bookingRepository.saveAndFlush(buildBooking(10L, "PENDING"));
        LocalDateTime createdAt = saved.getCreatedAt();
        LocalDateTime updatedAtInicial = saved.getUpdatedAt();
        Thread.sleep(5);

        saved.setStatus("CONFIRMED");
        Booking updated = bookingRepository.saveAndFlush(saved);

        assertThat(updated.getUpdatedAt()).isAfter(updatedAtInicial);
        assertThat(updated.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    void save_persisteTotalPriceYBasePrice() {
        Booking saved = bookingRepository.saveAndFlush(buildBooking(10L, "PENDING"));

        assertThat(saved.getTotalPrice()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(saved.getBasePrice()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(saved.getTicketQuantity()).isEqualTo(2);
    }

    @Test
    void save_cuandoStatusNulo_prePersistAsignaCONFIRMED() {
        Booking saved = bookingRepository.saveAndFlush(buildBooking(10L, null));

        assertThat(saved.getStatus()).isEqualTo("CONFIRMED");
    }

    @Test
    void findById_cuandoExiste_retornaOptionalConDatos() {
        Booking saved = bookingRepository.save(buildBooking(10L, "PENDING"));

        Optional<Booking> result = bookingRepository.findById(saved.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getUserEmail()).isEqualTo("juan@example.com");
    }

    @Test
    void findById_cuandoNoExiste_retornaOptionalVacio() {
        assertThat(bookingRepository.findById(9999L)).isEmpty();
    }

    @Test
    void findAll_cuandoHayReservas_retornaTodas() {
        bookingRepository.save(buildBooking(10L, "PENDING"));
        bookingRepository.save(buildBooking(11L, "CONFIRMED"));

        assertThat(bookingRepository.findAll()).hasSize(2);
    }

    @Test
    void findAll_cuandoNoHayReservas_retornaVacio() {
        assertThat(bookingRepository.findAll()).isEmpty();
    }

    @Test
    void findByUserId_cuandoUsuarioTieneReservas_retornaSoloLasSuyas() {
        bookingRepository.save(buildBooking(10L, "PENDING"));
        bookingRepository.save(buildBooking(11L, "PENDING"));

        List<Booking> result = bookingRepository.findByUserId(10L);

        assertThat(result).extracting(Booking::getUserId).containsExactly(10L);
    }

    @Test
    void findByUserId_cuandoUsuarioNoTieneReservas_retornaVacio() {
        assertThat(bookingRepository.findByUserId(999L)).isEmpty();
    }

    @Test
    void findByEventId_cuandoEventoTieneReservas_retornaLista() {
        bookingRepository.save(buildBooking(10L, "PENDING"));

        assertThat(bookingRepository.findByEventId(20L)).extracting(Booking::getEventId).containsExactly(20L);
    }

    @Test
    void findByEventId_cuandoEventoNoTieneReservas_retornaVacio() {
        assertThat(bookingRepository.findByEventId(999L)).isEmpty();
    }

    @Test
    void findByStatus_cuandoPENDING_retornaSoloPendientes() {
        bookingRepository.save(buildBooking(10L, "PENDING"));
        bookingRepository.save(buildBooking(11L, "CANCELLED"));

        assertThat(bookingRepository.findByStatus("PENDING")).extracting(Booking::getStatus).containsExactly("PENDING");
    }

    @Test
    void findByStatus_cuandoStatusNoExiste_retornaVacio() {
        bookingRepository.save(buildBooking(10L, "PENDING"));

        assertThat(bookingRepository.findByStatus("SUPERADMIN")).isEmpty();
    }
}
