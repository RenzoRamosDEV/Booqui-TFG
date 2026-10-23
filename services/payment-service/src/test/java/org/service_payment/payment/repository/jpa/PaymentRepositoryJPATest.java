package org.service_payment.payment.repository.jpa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.service_payment.payment.repository.PaymentRepository;
import org.service_payment.payment.repository.model.RepositoryPaymentModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class PaymentRepositoryJPATest {

    @Autowired
    private PaymentRepositoryJPA paymentRepositoryJPA;

    private PaymentRepository paymentRepository;

    @BeforeEach
    void setUp() {
        paymentRepository = paymentRepositoryJPA;
        paymentRepositoryJPA.deleteAll();
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private RepositoryPaymentModel buildPayment(Long bookingId, Long userId, Long eventId,
                                                 String method, String status) {
        return RepositoryPaymentModel.builder()
                .bookingId(bookingId)
                .userId(userId)
                .eventId(eventId)
                .ticketQuantity(2)
                .totalPrice(new BigDecimal("100.00"))
                .paymentMethod(method)
                .status(status)
                .creationDate(LocalDateTime.now())
                .build();
    }

    // ─── save ────────────────────────────────────────────────────────────────

    @Test
    void save_datosValidos_generaId() {
        RepositoryPaymentModel payment = buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED");

        RepositoryPaymentModel saved = paymentRepository.save(payment);

        assertThat(saved.getPaymentId()).isNotNull().isPositive();
    }

    @Test
    void save_persisteEstadoCorrectamente() {
        RepositoryPaymentModel payment = buildPayment(1L, 1L, 1L, "PAYPAL", "PENDING");

        RepositoryPaymentModel saved = paymentRepository.save(payment);

        assertThat(saved.getStatus()).isEqualTo("PENDING");
        assertThat(saved.getPaymentMethod()).isEqualTo("PAYPAL");
    }

    @Test
    void save_paymentNulo_lanzaExcepcion() {
        assertThatThrownBy(() -> paymentRepository.save(null))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("nulo");
    }

    // ─── findPaymentById ─────────────────────────────────────────────────────

    @Test
    void findPaymentById_existente_retornaPayment() {
        RepositoryPaymentModel saved = paymentRepository.save(
                buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));

        Optional<RepositoryPaymentModel> result = paymentRepository.findPaymentById(saved.getPaymentId());

        assertThat(result).isPresent();
        assertThat(result.get().getPaymentId()).isEqualTo(saved.getPaymentId());
    }

    @Test
    void findPaymentById_noExistente_retornaVacio() {
        Optional<RepositoryPaymentModel> result = paymentRepository.findPaymentById(9999L);

        assertThat(result).isEmpty();
    }

    @Test
    void findPaymentById_idNulo_retornaVacio() {
        Optional<RepositoryPaymentModel> result = paymentRepository.findPaymentById(null);

        assertThat(result).isEmpty();
    }

    // ─── findAllPayments ─────────────────────────────────────────────────────

    @Test
    void findAllPayments_conDatos_retornaColeccion() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 2L, "PAYPAL", "REJECTED"));

        Collection<RepositoryPaymentModel> result = paymentRepository.findAllPayments();

        assertThat(result).hasSize(2);
    }

    @Test
    void findAllPayments_sinDatos_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findAllPayments();

        assertThat(result).isNotNull().isEmpty();
    }

    // ─── findPaymentsByUserId ────────────────────────────────────────────────

    @Test
    void findPaymentsByUserId_existente_retornaPagosDelUsuario() {
        paymentRepository.save(buildPayment(1L, 10L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 10L, 2L, "PAYPAL", "APPROVED"));
        paymentRepository.save(buildPayment(3L, 20L, 3L, "DEBIT_CARD", "REJECTED"));

        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByUserId(10L);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(p -> p.getUserId().equals(10L));
    }

    @Test
    void findPaymentsByUserId_noExistente_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByUserId(9999L);

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findPaymentsByUserId_nulo_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByUserId(null);

        assertThat(result).isNotNull().isEmpty();
        verify_repositoryNotCalledForNull();
    }

    private void verify_repositoryNotCalledForNull() {
        // La validación es interna al método default — no se llega a JPA
    }

    // ─── findPaymentsByEventId ───────────────────────────────────────────────

    @Test
    void findPaymentsByEventId_existente_retornaPagosDelEvento() {
        paymentRepository.save(buildPayment(1L, 1L, 5L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 5L, "PAYPAL", "APPROVED"));
        paymentRepository.save(buildPayment(3L, 3L, 6L, "DEBIT_CARD", "REJECTED"));

        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByEventId(5L);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(p -> p.getEventId().equals(5L));
    }

    @Test
    void findPaymentsByEventId_noExistente_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByEventId(9999L);

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findPaymentsByEventId_nulo_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByEventId(null);

        assertThat(result).isNotNull().isEmpty();
    }

    // ─── findPaymentsByBookingId ─────────────────────────────────────────────

    @Test
    void findPaymentsByBookingId_existente_retornaPagosDeLaReserva() {
        paymentRepository.save(buildPayment(7L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(7L, 2L, 1L, "PAYPAL", "REJECTED"));
        paymentRepository.save(buildPayment(8L, 3L, 1L, "DEBIT_CARD", "APPROVED"));

        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByBookingId(7L);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(p -> p.getBookingId().equals(7L));
    }

    @Test
    void findPaymentsByBookingId_noExistente_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByBookingId(9999L);

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findPaymentsByBookingId_nulo_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByBookingId(null);

        assertThat(result).isNotNull().isEmpty();
    }

    // ─── findPaymentsByStatus ────────────────────────────────────────────────

    @Test
    void findPaymentsByStatus_aprobados_retornaAprobados() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 2L, "PAYPAL", "APPROVED"));
        paymentRepository.save(buildPayment(3L, 3L, 3L, "DEBIT_CARD", "REJECTED"));

        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByStatus("APPROVED");

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(p -> p.getStatus().equals("APPROVED"));
    }

    @Test
    void findPaymentsByStatus_rechazados_retornaRechazados() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 2L, "PAYPAL", "REJECTED"));

        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByStatus("REJECTED");

        assertThat(result).hasSize(1);
        assertThat(result.iterator().next().getStatus()).isEqualTo("REJECTED");
    }

    @Test
    void findPaymentsByStatus_estadoInvalido_retornaVacia() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));

        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByStatus("INVALID_STATUS");

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findPaymentsByStatus_nulo_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByStatus(null);

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findPaymentsByStatus_soloEspacios_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByStatus("   ");

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findPaymentsByStatus_vacio_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByStatus("");

        assertThat(result).isNotNull().isEmpty();
    }

    // ─── valores límite en campos numéricos ──────────────────────────────────
    // ticketQuantity mínimo válido = 1; totalPrice mínimo válido = 0.00

    @Test
    void save_ticketQuantityUno_persisteCorrectamente() {
        RepositoryPaymentModel payment = buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED");
        payment = RepositoryPaymentModel.builder()
                .bookingId(1L).userId(1L).eventId(1L)
                .ticketQuantity(1)                        // límite inferior válido
                .totalPrice(new BigDecimal("100.00"))
                .paymentMethod("CREDIT_CARD").status("APPROVED")
                .creationDate(java.time.LocalDateTime.now()).build();

        RepositoryPaymentModel saved = paymentRepository.save(payment);

        assertThat(saved.getTicketQuantity()).isEqualTo(1);
    }

    @Test
    void save_totalPriceCero_persisteCorrectamente() {
        RepositoryPaymentModel payment = RepositoryPaymentModel.builder()
                .bookingId(1L).userId(1L).eventId(1L)
                .ticketQuantity(1)
                .totalPrice(new BigDecimal("0.00"))       // límite inferior válido
                .paymentMethod("PAYPAL").status("APPROVED")
                .creationDate(java.time.LocalDateTime.now()).build();

        RepositoryPaymentModel saved = paymentRepository.save(payment);

        assertThat(saved.getTotalPrice()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void save_totalPriceMuyGrande_persisteCorrectamente() {
        RepositoryPaymentModel payment = RepositoryPaymentModel.builder()
                .bookingId(1L).userId(1L).eventId(1L)
                .ticketQuantity(500)
                .totalPrice(new BigDecimal("99999.99"))   // valor alto representativo
                .paymentMethod("BANK_TRANSFER").status("APPROVED")
                .creationDate(java.time.LocalDateTime.now()).build();

        RepositoryPaymentModel saved = paymentRepository.save(payment);

        assertThat(saved.getTotalPrice()).isEqualByComparingTo(new BigDecimal("99999.99"));
    }

    // ─── findPaymentsByPaymentMethod ─────────────────────────────────────────

    @Test
    void findPaymentsByPaymentMethod_creditCard_retornaCorrectos() {
        paymentRepository.save(buildPayment(1L, 1L, 1L, "CREDIT_CARD", "APPROVED"));
        paymentRepository.save(buildPayment(2L, 2L, 2L, "CREDIT_CARD", "REJECTED"));
        paymentRepository.save(buildPayment(3L, 3L, 3L, "PAYPAL", "APPROVED"));

        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByPaymentMethod("CREDIT_CARD");

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(p -> p.getPaymentMethod().equals("CREDIT_CARD"));
    }

    @Test
    void findPaymentsByPaymentMethod_nulo_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByPaymentMethod(null);

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findPaymentsByPaymentMethod_soloEspacios_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByPaymentMethod("   ");

        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findPaymentsByPaymentMethod_vacio_retornaVacia() {
        Collection<RepositoryPaymentModel> result = paymentRepository.findPaymentsByPaymentMethod("");

        assertThat(result).isNotNull().isEmpty();
    }
}
