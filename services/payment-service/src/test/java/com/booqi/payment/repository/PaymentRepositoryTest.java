package com.booqi.payment.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.booqi.payment.config.JpaConfig;
import com.booqi.payment.entity.Payment;

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

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(JpaConfig.class)
class PaymentRepositoryTest {

    private final PaymentRepository paymentRepository;

    PaymentRepositoryTest(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
    }

    private static Payment buildPayment(
            Long bookingId, Long userId, Long eventId, String method, String status) {
        return Payment.builder()
                .bookingId(bookingId)
                .userId(userId)
                .eventId(eventId)
                .ticketQuantity(2)
                .totalPrice(new BigDecimal("100.00"))
                .paymentMethod(method)
                .status(status)
                .build();
    }

    @Test
    void save_datosValidos_generaId() {
        Payment saved = paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));

        assertThat(saved.getId()).isNotNull().isPositive();
    }

    @Test
    void save_persisteEstadoCorrectamente() {
        Payment saved = paymentRepository.save(buildPayment(1L, 1L, 1L, "PAYPAL", "PENDING"));

        assertThat(saved.getStatus()).isEqualTo("PENDING");
        assertThat(saved.getPaymentMethod()).isEqualTo("PAYPAL");
    }

    @Test
    void save_rellenaIdYFechasDeAuditoria() {
        Payment saved =
                paymentRepository.saveAndFlush(buildPayment(1L, 1L, 1L, "PAYPAL", "PENDING"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void cambioDeEstado_avanzaUpdatedAtYConservaCreatedAt() throws InterruptedException {
        Payment saved =
                paymentRepository.saveAndFlush(buildPayment(1L, 1L, 1L, "PAYPAL", "PENDING"));
        LocalDateTime createdAt = saved.getCreatedAt();
        LocalDateTime updatedAtInicial = saved.getUpdatedAt();
        Thread.sleep(5);

        saved.setStatus("APPROVED");
        Payment updated = paymentRepository.saveAndFlush(saved);

        assertThat(updated.getUpdatedAt()).isAfter(updatedAtInicial);
        assertThat(updated.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    void findById_existente_retornaPayment() {
        Payment saved = paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));

        Optional<Payment> result = paymentRepository.findById(saved.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void findById_noExistente_retornaVacio() {
        assertThat(paymentRepository.findById(9999L)).isEmpty();
    }

    @Test
    void findAll_conDatos_retornaLista() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 2L, "PAYPAL", "REJECTED"));

        assertThat(paymentRepository.findAll()).hasSize(2);
    }

    @Test
    void findAll_sinDatos_retornaVacia() {
        assertThat(paymentRepository.findAll()).isEmpty();
    }

    @Test
    void findByUserId_existente_retornaPagosDelUsuario() {
        paymentRepository.save(buildPayment(1L, 10L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 10L, 2L, "PAYPAL", "APPROVED"));
        paymentRepository.save(buildPayment(3L, 20L, 3L, "DEBIT_CARD", "REJECTED"));

        List<Payment> result = paymentRepository.findByUserId(10L);

        assertThat(result).hasSize(2).allMatch(p -> p.getUserId().equals(10L));
    }

    @Test
    void findByUserId_noExistente_retornaVacia() {
        assertThat(paymentRepository.findByUserId(9999L)).isEmpty();
    }

    @Test
    void findByEventId_existente_retornaPagosDelEvento() {
        paymentRepository.save(buildPayment(1L, 1L, 5L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 5L, "PAYPAL", "APPROVED"));
        paymentRepository.save(buildPayment(3L, 3L, 6L, "DEBIT_CARD", "REJECTED"));

        List<Payment> result = paymentRepository.findByEventId(5L);

        assertThat(result).hasSize(2).allMatch(p -> p.getEventId().equals(5L));
    }

    @Test
    void findByEventId_noExistente_retornaVacia() {
        assertThat(paymentRepository.findByEventId(9999L)).isEmpty();
    }

    @Test
    void findByBookingId_existente_retornaPagosDeLaReserva() {
        paymentRepository.save(buildPayment(7L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(7L, 2L, 1L, "PAYPAL", "REJECTED"));
        paymentRepository.save(buildPayment(8L, 3L, 1L, "DEBIT_CARD", "APPROVED"));

        List<Payment> result = paymentRepository.findByBookingId(7L);

        assertThat(result).hasSize(2).allMatch(p -> p.getBookingId().equals(7L));
    }

    @Test
    void findByBookingId_noExistente_retornaVacia() {
        assertThat(paymentRepository.findByBookingId(9999L)).isEmpty();
    }

    @Test
    void findByStatus_aprobados_retornaAprobados() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 2L, "PAYPAL", "APPROVED"));
        paymentRepository.save(buildPayment(3L, 3L, 3L, "DEBIT_CARD", "REJECTED"));

        List<Payment> result = paymentRepository.findByStatus("APPROVED");

        assertThat(result).hasSize(2).allMatch(p -> p.getStatus().equals("APPROVED"));
    }

    @Test
    void findByStatus_rechazados_retornaRechazados() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 2L, "PAYPAL", "REJECTED"));

        List<Payment> result = paymentRepository.findByStatus("REJECTED");

        assertThat(result).singleElement().extracting(Payment::getStatus).isEqualTo("REJECTED");
    }

    @Test
    void findByStatus_estadoInexistente_retornaVacia() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));

        assertThat(paymentRepository.findByStatus("INVALID_STATUS")).isEmpty();
    }

    @Test
    void save_ticketQuantityUno_persisteCorrectamente() {
        Payment payment = buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED");
        payment.setTicketQuantity(1);

        assertThat(paymentRepository.save(payment).getTicketQuantity()).isEqualTo(1);
    }

    @Test
    void save_totalPriceCero_persisteCorrectamente() {
        Payment payment = buildPayment(1L, 1L, 1L, "PAYPAL", "APPROVED");
        payment.setTotalPrice(new BigDecimal("0.00"));

        assertThat(paymentRepository.save(payment).getTotalPrice())
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void save_totalPriceMuyGrande_persisteCorrectamente() {
        Payment payment = buildPayment(1L, 1L, 1L, "BANK_TRANSFER", "APPROVED");
        payment.setTicketQuantity(500);
        payment.setTotalPrice(new BigDecimal("99999.99"));

        assertThat(paymentRepository.save(payment).getTotalPrice())
                .isEqualByComparingTo(new BigDecimal("99999.99"));
    }
}
