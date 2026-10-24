package com.booqi.payment.service.impl;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.booqi.payment.client.BookingClient;
import com.booqi.payment.client.EventClient;
import com.booqi.payment.dto.request.CreatePaymentRequest;
import com.booqi.payment.dto.request.PaymentFilter;
import com.booqi.payment.dto.response.PaymentResponse;
import com.booqi.payment.entity.Payment;
import com.booqi.payment.exception.BusinessException;
import com.booqi.payment.exception.InvalidFilterException;
import com.booqi.payment.exception.RemoteServiceException;
import com.booqi.payment.exception.ResourceNotFoundException;
import com.booqi.payment.mapper.PaymentMapper;
import com.booqi.payment.mapper.PaymentMapperImpl;
import com.booqi.payment.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    private static final String EVEN_CARD = "4111111111111112";
    private static final String ODD_CARD = "4111111111111111";

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private EventClient eventClient;

    @Mock
    private BookingClient bookingClient;

    @Spy
    private PaymentMapper paymentMapper = new PaymentMapperImpl();

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private final List<Payment> savedSnapshots = new ArrayList<>();

    private static CreatePaymentRequest request(String method, String cardNumber) {
        return request(method, cardNumber, new BigDecimal("100.00"));
    }

    private static CreatePaymentRequest request(String method, String cardNumber, BigDecimal totalPrice) {
        return new CreatePaymentRequest(1L, 3L, 2L, 2, totalPrice, method, cardNumber, "123");
    }

    private static CreatePaymentRequest cardRequest(String cardNumber) {
        return request("CREDIT_CARD", cardNumber);
    }

    private static Payment copyOf(Payment source) {
        return Payment.builder()
                .id(source.getId())
                .bookingId(source.getBookingId())
                .userId(source.getUserId())
                .eventId(source.getEventId())
                .ticketQuantity(source.getTicketQuantity())
                .totalPrice(source.getTotalPrice())
                .paymentMethod(source.getPaymentMethod())
                .status(source.getStatus())
                .transactionId(source.getTransactionId())
                .errorMessage(source.getErrorMessage())
                .paymentDate(source.getPaymentDate())
                .createdAt(source.getCreatedAt())
                .updatedAt(source.getUpdatedAt())
                .build();
    }

    private void givenRepositoryAssignsIdAndRecordsEachSave() {
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment argument = invocation.getArgument(0);
            savedSnapshots.add(copyOf(argument));
            Payment managed = copyOf(argument);
            managed.setId(5L);
            return managed;
        });
    }

    private Payment firstSave() {
        return savedSnapshots.get(0);
    }

    private Payment lastSave() {
        return savedSnapshots.get(savedSnapshots.size() - 1);
    }

    private static Payment payment(long id, String status) {
        return Payment.builder().id(id).bookingId(1L).userId(3L).eventId(2L).ticketQuantity(2)
                .totalPrice(new BigDecimal("100.00")).paymentMethod("PAYPAL").status(status).build();
    }

    // process: simulation outcome

    @ParameterizedTest(name = "card {0} -> APPROVED")
    @ValueSource(strings = {EVEN_CARD, "4111111111111110", "4111111111111118"})
    void process_tarjetaTerminaEnPar_apruebaDecrementaStockYConfirma(String card) {
        givenRepositoryAssignsIdAndRecordsEachSave();

        PaymentResponse result = paymentService.process(cardRequest(card));

        assertThat(result.id()).isEqualTo(5L);
        assertThat(result.status()).isEqualTo("APPROVED");
        verify(eventClient).decrementStock(2L, 2);
        verify(bookingClient).confirm(1L);
        verify(bookingClient, never()).cancel(anyLong());
    }

    @ParameterizedTest(name = "card {0} -> REJECTED")
    @ValueSource(strings = {ODD_CARD, "4111111111111113", "4111111111111119"})
    void process_tarjetaTerminaEnImpar_rechazaYCancelaSinTocarStock(String card) {
        givenRepositoryAssignsIdAndRecordsEachSave();

        PaymentResponse result = paymentService.process(cardRequest(card));

        assertThat(result.status()).isEqualTo("REJECTED");
        assertThat(result.errorMessage()).isEqualTo("Payment rejected by simulation");
        verify(eventClient, never()).decrementStock(anyLong(), any());
        verify(bookingClient, never()).confirm(anyLong());
        verify(bookingClient).cancel(1L);
    }

    @Test
    void process_sinNumeroTarjeta_aprueba() {
        givenRepositoryAssignsIdAndRecordsEachSave();

        PaymentResponse result = paymentService.process(request("PAYPAL", null));

        assertThat(result.status()).isEqualTo("APPROVED");
        verify(eventClient).decrementStock(2L, 2);
        verify(bookingClient).confirm(1L);
    }

    @Test
    void process_tarjetaVacia_aprueba() {
        givenRepositoryAssignsIdAndRecordsEachSave();

        PaymentResponse result = paymentService.process(request("BANK_TRANSFER", ""));

        assertThat(result.status()).isEqualTo("APPROVED");
    }

    // process: persisted state

    @Test
    void process_primerGuardadoEsPendingConLosDatosDeLaSolicitud() {
        givenRepositoryAssignsIdAndRecordsEachSave();

        paymentService.process(cardRequest(EVEN_CARD));

        Payment pending = firstSave();
        assertThat(pending.getStatus()).isEqualTo("PENDING");
        assertThat(pending.getId()).isNull();
        assertThat(pending.getBookingId()).isEqualTo(1L);
        assertThat(pending.getUserId()).isEqualTo(3L);
        assertThat(pending.getEventId()).isEqualTo(2L);
        assertThat(pending.getTicketQuantity()).isEqualTo(2);
        assertThat(pending.getTotalPrice()).isEqualByComparingTo("100.00");
        assertThat(pending.getPaymentMethod()).isEqualTo("CREDIT_CARD");
        assertThat(pending.getCreatedAt()).isNull();
        assertThat(pending.getPaymentDate()).isNull();
    }

    @Test
    void process_aprobado_segundoGuardadoTieneEstadoTransaccionYFecha() {
        givenRepositoryAssignsIdAndRecordsEachSave();

        paymentService.process(cardRequest(EVEN_CARD));

        assertThat(savedSnapshots).hasSize(2);
        Payment approved = lastSave();
        assertThat(approved.getId()).isEqualTo(5L);
        assertThat(approved.getStatus()).isEqualTo("APPROVED");
        assertThat(approved.getTransactionId()).isNotBlank();
        assertThat(approved.getPaymentDate()).isNotNull();
        assertThat(approved.getErrorMessage()).isNull();
    }

    @Test
    void process_rechazado_segundoGuardadoTieneEstadoMensajeYFecha() {
        givenRepositoryAssignsIdAndRecordsEachSave();

        paymentService.process(cardRequest(ODD_CARD));

        assertThat(savedSnapshots).hasSize(2);
        Payment rejected = lastSave();
        assertThat(rejected.getStatus()).isEqualTo("REJECTED");
        assertThat(rejected.getErrorMessage()).isEqualTo("Payment rejected by simulation");
        assertThat(rejected.getPaymentDate()).isNotNull();
        assertThat(rejected.getTransactionId()).isNull();
    }

    // process: failures during processing

    @Test
    void process_cuandoDecrementStockFalla_guardaRechazadoConElMensajeYCancela() {
        givenRepositoryAssignsIdAndRecordsEachSave();
        doThrow(new RuntimeException("fallo externo")).when(eventClient).decrementStock(anyLong(), any());

        PaymentResponse result = paymentService.process(cardRequest(EVEN_CARD));

        assertThat(result.status()).isEqualTo("REJECTED");
        assertThat(result.errorMessage()).isEqualTo("fallo externo");
        Payment rejected = lastSave();
        assertThat(rejected.getStatus()).isEqualTo("REJECTED");
        assertThat(rejected.getErrorMessage()).isEqualTo("fallo externo");
        assertThat(rejected.getPaymentDate()).isNotNull();
        verify(bookingClient, never()).confirm(anyLong());
        verify(bookingClient).cancel(1L);
    }

    @Test
    void process_cuandoConfirmFalla_guardaRechazado() {
        givenRepositoryAssignsIdAndRecordsEachSave();
        doThrow(new RuntimeException("Booking down")).when(bookingClient).confirm(anyLong());

        PaymentResponse result = paymentService.process(cardRequest(EVEN_CARD));

        assertThat(result.status()).isEqualTo("REJECTED");
        assertThat(result.errorMessage()).isEqualTo("Booking down");
        verify(bookingClient).cancel(1L);
    }

    @Test
    void process_cuandoCancelTambienFalla_noLanzaYDevuelveRechazado() {
        givenRepositoryAssignsIdAndRecordsEachSave();
        doThrow(new RuntimeException("Cancel down")).when(bookingClient).cancel(anyLong());

        PaymentResponse result = paymentService.process(cardRequest(ODD_CARD));

        assertThat(result.status()).isEqualTo("REJECTED");
        assertThat(result.errorMessage()).isEqualTo("Cancel down");
    }

    @Test
    void process_cuandoStockInsuficiente_guardaRechazadoConElDetalleRemotoSinConfirmar() {
        givenRepositoryAssignsIdAndRecordsEachSave();
        doThrow(new BusinessException("Insufficient stock for event 3: available 4, requested 5"))
                .when(eventClient).decrementStock(anyLong(), any());

        PaymentResponse result = paymentService.process(request("PAYPAL", null));

        assertThat(result.status()).isEqualTo("REJECTED");
        assertThat(result.errorMessage()).isEqualTo("Insufficient stock for event 3: available 4, requested 5");
        assertThat(lastSave().getErrorMessage()).isEqualTo("Insufficient stock for event 3: available 4, requested 5");
        verify(bookingClient, never()).confirm(anyLong());
        verify(bookingClient).cancel(1L);
    }

    @Test
    void process_cuandoEventServiceNoDisponible_guardaRechazado() {
        givenRepositoryAssignsIdAndRecordsEachSave();
        doThrow(new RemoteServiceException("Event service is unavailable"))
                .when(eventClient).decrementStock(anyLong(), any());

        PaymentResponse result = paymentService.process(request("PAYPAL", null));

        assertThat(result.status()).isEqualTo("REJECTED");
        assertThat(result.errorMessage()).isEqualTo("Event service is unavailable");
        verify(bookingClient).cancel(1L);
    }

    // process: input rule beyond Bean Validation

    @Test
    void process_totalPriceSuperiorAlMaximo_lanzaBusinessSinGuardarNiLlamarClientes() {
        CreatePaymentRequest tooLarge = request("PAYPAL", null, new BigDecimal("100000000.00"));

        assertThatThrownBy(() -> paymentService.process(tooLarge))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Total price must not exceed 99999999.99");
        verifyNoInteractions(paymentRepository, eventClient, bookingClient);
    }

    @Test
    void process_totalPriceEnElMaximo_seProcesa() {
        givenRepositoryAssignsIdAndRecordsEachSave();

        PaymentResponse result = paymentService.process(request("PAYPAL", null, new BigDecimal("99999999.99")));

        assertThat(result.status()).isEqualTo("APPROVED");
        assertThat(firstSave().getTotalPrice()).isEqualByComparingTo("99999999.99");
    }

    // process: card data never logged

    @Test
    void process_conDebug_noEscribeTarjetaNiCvvEnLosLogs() {
        Logger logger = (Logger) LoggerFactory.getLogger("com.booqi.payment");
        Level previous = logger.getLevel();
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.setLevel(Level.DEBUG);
        logger.addAppender(appender);
        try {
            givenRepositoryAssignsIdAndRecordsEachSave();

            paymentService.process(cardRequest(EVEN_CARD));

            List<String> messages = appender.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
            assertThat(messages).isNotEmpty()
                    .noneMatch(message -> message.contains(EVEN_CARD))
                    .noneMatch(message -> message.contains("cvv=123"))
                    .noneMatch(message -> message.contains("Card ends in"))
                    .contains("Simulated payment APPROVED for method CREDIT_CARD");
        } finally {
            logger.detachAppender(appender);
            logger.setLevel(previous);
        }
    }

    // findById / existsById

    @Test
    void findById_existente_retornaPago() {
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment(5L, "APPROVED")));

        PaymentResponse result = paymentService.findById(5L);

        assertThat(result.id()).isEqualTo(5L);
        assertThat(result.status()).isEqualTo("APPROVED");
    }

    @Test
    void findById_inexistente_lanzaResourceNotFound() {
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.findById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Payment with id 999 not found");
    }

    @Test
    void existsById_reflejaElRepositorio() {
        when(paymentRepository.existsById(5L)).thenReturn(true);
        when(paymentRepository.existsById(6L)).thenReturn(false);

        assertThat(paymentService.existsById(5L)).isTrue();
        assertThat(paymentService.existsById(6L)).isFalse();
    }

    // single-field queries

    @Test
    void findAll_retornaTodosMapeados() {
        when(paymentRepository.findAll()).thenReturn(List.of(payment(1L, "APPROVED"), payment(2L, "REJECTED")));

        assertThat(paymentService.findAll()).extracting(PaymentResponse::id).containsExactly(1L, 2L);
    }

    @Test
    void findAll_sinPagos_retornaVacio() {
        when(paymentRepository.findAll()).thenReturn(List.of());

        assertThat(paymentService.findAll()).isEmpty();
    }

    @Test
    void findByUserId_retornaPagosDelUsuario() {
        when(paymentRepository.findByUserId(3L)).thenReturn(List.of(payment(1L, "APPROVED")));

        assertThat(paymentService.findByUserId(3L)).extracting(PaymentResponse::id).containsExactly(1L);
    }

    @Test
    void findByEventId_retornaPagosDelEvento() {
        when(paymentRepository.findByEventId(2L)).thenReturn(List.of(payment(2L, "APPROVED")));

        assertThat(paymentService.findByEventId(2L)).extracting(PaymentResponse::id).containsExactly(2L);
    }

    @Test
    void findByBookingId_retornaPagosDeLaReserva() {
        when(paymentRepository.findByBookingId(1L)).thenReturn(List.of(payment(3L, "APPROVED")));

        assertThat(paymentService.findByBookingId(1L)).extracting(PaymentResponse::id).containsExactly(3L);
    }

    @Test
    void findByStatus_retornaPagosConEseEstado() {
        when(paymentRepository.findByStatus("REJECTED")).thenReturn(List.of(payment(4L, "REJECTED")));

        assertThat(paymentService.findByStatus("REJECTED")).extracting(PaymentResponse::id).containsExactly(4L);
    }

    // findAll(PaymentFilter)

    @Test
    void findAllFiltro_sinFiltros_retornaTodos() {
        when(paymentRepository.findAll()).thenReturn(List.of(payment(1L, "APPROVED")));

        assertThat(paymentService.findAll(new PaymentFilter(null, null, null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_statusEnBlancoSinMasFiltros_retornaTodos() {
        when(paymentRepository.findAll()).thenReturn(List.of(payment(1L, "APPROVED")));

        assertThat(paymentService.findAll(new PaymentFilter(null, null, null, " "))).hasSize(1);
        verify(paymentRepository, never()).findByStatus(any());
    }

    @Test
    void findAllFiltro_porUserId() {
        when(paymentRepository.findByUserId(3L)).thenReturn(List.of(payment(1L, "APPROVED")));

        assertThat(paymentService.findAll(new PaymentFilter(3L, null, null, null)))
                .extracting(PaymentResponse::id).containsExactly(1L);
    }

    @Test
    void findAllFiltro_porEventId() {
        when(paymentRepository.findByEventId(2L)).thenReturn(List.of(payment(2L, "APPROVED")));

        assertThat(paymentService.findAll(new PaymentFilter(null, 2L, null, null)))
                .extracting(PaymentResponse::id).containsExactly(2L);
    }

    @Test
    void findAllFiltro_porBookingId() {
        when(paymentRepository.findByBookingId(1L)).thenReturn(List.of(payment(3L, "APPROVED")));

        assertThat(paymentService.findAll(new PaymentFilter(null, null, 1L, null)))
                .extracting(PaymentResponse::id).containsExactly(3L);
    }

    @Test
    void findAllFiltro_porStatus() {
        when(paymentRepository.findByStatus("APPROVED")).thenReturn(List.of(payment(4L, "APPROVED")));

        assertThat(paymentService.findAll(new PaymentFilter(null, null, null, "APPROVED")))
                .extracting(PaymentResponse::id).containsExactly(4L);
    }

    @Test
    void findAllFiltro_statusEnBlancoSeIgnoraJuntoABookingId() {
        when(paymentRepository.findByBookingId(1L)).thenReturn(List.of(payment(3L, "APPROVED")));

        assertThat(paymentService.findAll(new PaymentFilter(null, null, 1L, ""))).hasSize(1);
    }

    static Stream<PaymentFilter> paresDeFiltros() {
        return Stream.of(
                new PaymentFilter(3L, 2L, null, null),
                new PaymentFilter(3L, null, 1L, null),
                new PaymentFilter(3L, null, null, "APPROVED"),
                new PaymentFilter(null, 2L, 1L, null),
                new PaymentFilter(null, 2L, null, "APPROVED"),
                new PaymentFilter(null, null, 1L, "APPROVED"),
                new PaymentFilter(3L, 2L, 1L, "APPROVED"));
    }

    @ParameterizedTest
    @MethodSource("paresDeFiltros")
    void findAllFiltro_variosFiltros_lanzaInvalidFilterSinConsultar(PaymentFilter filtro) {
        assertThatThrownBy(() -> paymentService.findAll(filtro))
                .isInstanceOf(InvalidFilterException.class)
                .hasMessage("Only one filter may be used at a time");
        verifyNoInteractions(paymentRepository);
    }
}
