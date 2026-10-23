package org.service_payment.payment.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.service_payment.payment.client.BookingServiceClient;
import org.service_payment.payment.client.EventServiceClient;
import org.service_payment.payment.repository.PaymentRepository;
import org.service_payment.payment.repository.model.RepositoryPaymentModel;
import org.service_payment.payment.service.model.PaymentCreateDTO;
import org.service_payment.payment.service.model.PaymentResponseDTO;
import org.service_payment.payment.service.model.ServicePaymentMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private EventServiceClient eventServiceClient;

    @Mock
    private BookingServiceClient bookingServiceClient;

    @Mock
    private ServicePaymentMapper servicePaymentMapper;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    // ─── helpers ────────────────────────────────────────────────────────────

    private PaymentCreateDTO validDTO() {
        return PaymentCreateDTO.builder()
                .bookingId(1L)
                .userId(1L)
                .eventId(1L)
                .ticketQuantity(2)
                .totalPrice(new BigDecimal("100.00"))
                .paymentMethod("CREDIT_CARD")
                .cardNumber("4111111111111112") // termina en 2 (par) → APPROVED
                .build();
    }

    private RepositoryPaymentModel savedModel(String status) {
        return RepositoryPaymentModel.builder()
                .paymentId(1L)
                .bookingId(1L)
                .userId(1L)
                .eventId(1L)
                .ticketQuantity(2)
                .totalPrice(new BigDecimal("100.00"))
                .paymentMethod("CREDIT_CARD")
                .status(status)
                .creationDate(LocalDateTime.now())
                .build();
    }

    private PaymentResponseDTO responseDTO(String status) {
        return PaymentResponseDTO.builder()
                .paymentId(1L)
                .status(status)
                .build();
    }

    // ─── processPayment – camino feliz APPROVED ──────────────────────────────

    @Test
    void processPayment_tarjetaTerminaEnPar_guardaAprobado() {
        RepositoryPaymentModel pending = savedModel("PENDING");
        RepositoryPaymentModel approved = savedModel("APPROVED");

        when(paymentRepository.save(any())).thenReturn(pending, approved);
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        PaymentResponseDTO result = paymentService.processPayment(validDTO());

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("APPROVED");
        verify(eventServiceClient).decrementStock(1L, 2);
        verify(bookingServiceClient).confirmBooking(1L);
    }

    @Test
    void processPayment_tarjetaTerminaEnImpar_guardaRechazado() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111111"); // termina en 1 (impar) → REJECTED

        RepositoryPaymentModel pending = savedModel("PENDING");
        RepositoryPaymentModel rejected = savedModel("REJECTED");

        when(paymentRepository.save(any())).thenReturn(pending, rejected);
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        PaymentResponseDTO result = paymentService.processPayment(dto);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("REJECTED");
        verify(eventServiceClient, never()).decrementStock(anyLong(), any());
        verify(bookingServiceClient, never()).confirmBooking(anyLong());
        verify(bookingServiceClient).cancelBooking(1L);
    }

    @Test
    void processPayment_sinNumeroTarjeta_aprueba() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber(null);
        dto.setPaymentMethod("PAYPAL");

        RepositoryPaymentModel pending = savedModel("PENDING");
        RepositoryPaymentModel approved = savedModel("APPROVED");

        when(paymentRepository.save(any())).thenReturn(pending, approved);
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        PaymentResponseDTO result = paymentService.processPayment(dto);

        assertThat(result.getStatus()).isEqualTo("APPROVED");
        verify(eventServiceClient).decrementStock(1L, 2);
        verify(bookingServiceClient).confirmBooking(1L);
    }

    @Test
    void processPayment_tarjetaVacia_aprueba() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("");
        dto.setPaymentMethod("BANK_TRANSFER");

        RepositoryPaymentModel pending = savedModel("PENDING");
        RepositoryPaymentModel approved = savedModel("APPROVED");

        when(paymentRepository.save(any())).thenReturn(pending, approved);
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        PaymentResponseDTO result = paymentService.processPayment(dto);

        assertThat(result.getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void processPayment_estadoInicialEsPending() {
        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        RepositoryPaymentModel pending = savedModel("PENDING");
        when(paymentRepository.save(captor.capture())).thenReturn(pending, savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        paymentService.processPayment(validDTO());

        assertThat(captor.getAllValues().get(0).getStatus()).isEqualTo("PENDING");
    }

    @Test
    void processPayment_cuandoEventServiceFalla_guardaRechazadoYCancelaReserva() {
        RepositoryPaymentModel pending = savedModel("PENDING");
        RepositoryPaymentModel rejected = savedModel("REJECTED");

        when(paymentRepository.save(any())).thenReturn(pending, rejected);
        doThrow(new RuntimeException("Event Service no disponible"))
                .when(eventServiceClient).decrementStock(anyLong(), any());
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        PaymentResponseDTO result = paymentService.processPayment(validDTO());

        assertThat(result.getStatus()).isEqualTo("REJECTED");
        verify(bookingServiceClient).cancelBooking(1L);
    }

    @Test
    void processPayment_cuandoBookingConfirmFalla_guardaRechazado() {
        RepositoryPaymentModel pending = savedModel("PENDING");
        RepositoryPaymentModel rejected = savedModel("REJECTED");

        when(paymentRepository.save(any())).thenReturn(pending, rejected);
        doNothing().when(eventServiceClient).decrementStock(anyLong(), any());
        doThrow(new RuntimeException("Booking Service no disponible"))
                .when(bookingServiceClient).confirmBooking(anyLong());
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        PaymentResponseDTO result = paymentService.processPayment(validDTO());

        assertThat(result.getStatus()).isEqualTo("REJECTED");
    }

    @Test
    void processPayment_cuandoBookingCancelFallaTambien_noLanzaExcepcion() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111111"); // REJECTED

        RepositoryPaymentModel pending = savedModel("PENDING");
        RepositoryPaymentModel rejected = savedModel("REJECTED");

        when(paymentRepository.save(any())).thenReturn(pending, rejected);
        doThrow(new RuntimeException("Cancel también falla"))
                .when(bookingServiceClient).cancelBooking(anyLong());
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        // No debe lanzar excepción aunque cancelBooking falle
        assertThat(paymentService.processPayment(dto)).isNotNull();
    }

    // ─── cardNumber – valores límite del algoritmo par/impar ────────────────
    // Límite APPROVED: dígito 0 (par mínimo), 2, 4, 6, 8
    // Límite REJECTED: dígito 1 (impar mínimo), 3, 5, 7, 9
    // Probamos los dos extremos exactos del rango: 0 y 9

    @Test
    void processPayment_tarjetaTerminaEnCero_aprueba() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111110"); // dígito par extremo inferior

        when(paymentRepository.save(any())).thenReturn(savedModel("PENDING"), savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        PaymentResponseDTO result = paymentService.processPayment(dto);

        assertThat(result.getStatus()).isEqualTo("APPROVED");
        verify(eventServiceClient).decrementStock(1L, 2);
    }

    @Test
    void processPayment_tarjetaTerminaEnOcho_aprueba() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111118"); // dígito par extremo superior

        when(paymentRepository.save(any())).thenReturn(savedModel("PENDING"), savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        PaymentResponseDTO result = paymentService.processPayment(dto);

        assertThat(result.getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void processPayment_tarjetaTerminaEnNueve_rechaza() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111119"); // dígito impar extremo superior

        when(paymentRepository.save(any())).thenReturn(savedModel("PENDING"), savedModel("REJECTED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        PaymentResponseDTO result = paymentService.processPayment(dto);

        assertThat(result.getStatus()).isEqualTo("REJECTED");
        verify(eventServiceClient, never()).decrementStock(anyLong(), any());
    }

    @Test
    void processPayment_tarjetaTerminaEnTres_rechaza() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111113"); // impar intermedio

        when(paymentRepository.save(any())).thenReturn(savedModel("PENDING"), savedModel("REJECTED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        PaymentResponseDTO result = paymentService.processPayment(dto);

        assertThat(result.getStatus()).isEqualTo("REJECTED");
    }

    // ─── processPayment – clases de equivalencia adicionales ────────────────

    @Test
    void processPayment_capturaBookingIdCorrecto() {
        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture())).thenReturn(savedModel("PENDING"), savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        paymentService.processPayment(validDTO());

        assertThat(captor.getAllValues().get(0).getBookingId()).isEqualTo(1L);
        assertThat(captor.getAllValues().get(0).getUserId()).isEqualTo(1L);
        assertThat(captor.getAllValues().get(0).getEventId()).isEqualTo(1L);
    }

    @Test
    void processPayment_capturaMetodoPagoEnModelo() {
        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture())).thenReturn(savedModel("PENDING"), savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        paymentService.processPayment(validDTO());

        assertThat(captor.getAllValues().get(0).getPaymentMethod()).isEqualTo("CREDIT_CARD");
    }

    @Test
    void processPayment_retornoNoEsNulo() {
        when(paymentRepository.save(any())).thenReturn(savedModel("PENDING"), savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        PaymentResponseDTO result = paymentService.processPayment(validDTO());

        assertThat(result).isNotNull();
    }

    // ─── mutantes VoidMethodCallMutator – setStatus/setTransactionId/setPaymentDate ──
    // Pitest elimina los setters sobre savedPayment antes del segundo save().
    // Capturamos ese segundo save y verificamos el estado exacto del modelo.

    @Test
    void processPayment_aprobado_guardaStatusAprobadoEnSegundoSave() {
        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture()))
                .thenReturn(savedModel("PENDING"), savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        paymentService.processPayment(validDTO());

        RepositoryPaymentModel segundoSave = captor.getAllValues().get(1);
        assertThat(segundoSave.getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void processPayment_aprobado_guardaTransactionIdNoNuloEnSegundoSave() {
        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture()))
                .thenReturn(savedModel("PENDING"), savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        paymentService.processPayment(validDTO());

        RepositoryPaymentModel segundoSave = captor.getAllValues().get(1);
        assertThat(segundoSave.getTransactionId()).isNotNull().isNotEmpty();
    }

    @Test
    void processPayment_aprobado_guardaPaymentDateNoNuloEnSegundoSave() {
        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture()))
                .thenReturn(savedModel("PENDING"), savedModel("APPROVED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        paymentService.processPayment(validDTO());

        RepositoryPaymentModel segundoSave = captor.getAllValues().get(1);
        assertThat(segundoSave.getPaymentDate()).isNotNull();
    }

    @Test
    void processPayment_rechazado_guardaStatusRechazadoEnSegundoSave() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111111"); // impar → REJECTED

        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture()))
                .thenReturn(savedModel("PENDING"), savedModel("REJECTED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        paymentService.processPayment(dto);

        RepositoryPaymentModel segundoSave = captor.getAllValues().get(1);
        assertThat(segundoSave.getStatus()).isEqualTo("REJECTED");
    }

    @Test
    void processPayment_rechazado_guardaErrorMessageEnSegundoSave() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111111"); // impar → REJECTED

        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture()))
                .thenReturn(savedModel("PENDING"), savedModel("REJECTED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        paymentService.processPayment(dto);

        RepositoryPaymentModel segundoSave = captor.getAllValues().get(1);
        assertThat(segundoSave.getErrorMessage()).isNotNull().isNotEmpty();
    }

    @Test
    void processPayment_rechazado_guardaPaymentDateEnSegundoSave() {
        PaymentCreateDTO dto = validDTO();
        dto.setCardNumber("4111111111111111");

        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture()))
                .thenReturn(savedModel("PENDING"), savedModel("REJECTED"));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        paymentService.processPayment(dto);

        RepositoryPaymentModel segundoSave = captor.getAllValues().get(1);
        assertThat(segundoSave.getPaymentDate()).isNotNull();
    }

    @Test
    void processPayment_excepcion_guardaStatusRejectedYErrorMessageYPaymentDate() {
        ArgumentCaptor<RepositoryPaymentModel> captor = ArgumentCaptor.forClass(RepositoryPaymentModel.class);
        when(paymentRepository.save(captor.capture()))
                .thenReturn(savedModel("PENDING"), savedModel("REJECTED"));
        doThrow(new RuntimeException("fallo externo"))
                .when(eventServiceClient).decrementStock(anyLong(), any());
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("REJECTED"));

        paymentService.processPayment(validDTO());

        RepositoryPaymentModel segundoSave = captor.getAllValues().get(1);
        assertThat(segundoSave.getStatus()).isEqualTo("REJECTED");
        assertThat(segundoSave.getErrorMessage()).isEqualTo("fallo externo");
        assertThat(segundoSave.getPaymentDate()).isNotNull();
    }

    // ─── getPaymentById ──────────────────────────────────────────────────────

    @Test
    void getPaymentById_existente_retornaDTO() {
        when(paymentRepository.findPaymentById(1L)).thenReturn(Optional.of(savedModel("APPROVED")));
        when(servicePaymentMapper.toResponseDTO(any())).thenReturn(responseDTO("APPROVED"));

        PaymentResponseDTO result = paymentService.getPaymentById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void getPaymentById_noExistente_lanzaExcepcion() {
        when(paymentRepository.findPaymentById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("999");
    }

    @Test
    void getPaymentById_idNulo_lanzaExcepcion() {
        when(paymentRepository.findPaymentById(null)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPaymentById(null))
                .isInstanceOf(RuntimeException.class);
    }

    // ─── getAllPayments ──────────────────────────────────────────────────────

    @Test
    void getAllPayments_retornaColeccion() {
        when(paymentRepository.findAllPayments()).thenReturn(List.of(savedModel("APPROVED")));
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of(responseDTO("APPROVED")));

        Collection<PaymentResponseDTO> result = paymentService.getAllPayments();

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getAllPayments_listaVacia_retornaColeccionVacia() {
        when(paymentRepository.findAllPayments()).thenReturn(List.of());
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of());

        Collection<PaymentResponseDTO> result = paymentService.getAllPayments();

        assertThat(result).isNotNull().isEmpty();
    }

    // ─── getPaymentsByUserId ─────────────────────────────────────────────────

    @Test
    void getPaymentsByUserId_existente_retornaColeccion() {
        when(paymentRepository.findPaymentsByUserId(1L)).thenReturn(List.of(savedModel("APPROVED")));
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of(responseDTO("APPROVED")));

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByUserId(1L);

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getPaymentsByUserId_sinResultados_retornaVacia() {
        when(paymentRepository.findPaymentsByUserId(99L)).thenReturn(List.of());
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of());

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByUserId(99L);

        assertThat(result).isNotNull().isEmpty();
    }

    // ─── getPaymentsByEventId ────────────────────────────────────────────────

    @Test
    void getPaymentsByEventId_existente_retornaColeccion() {
        when(paymentRepository.findPaymentsByEventId(1L)).thenReturn(List.of(savedModel("APPROVED")));
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of(responseDTO("APPROVED")));

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByEventId(1L);

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getPaymentsByEventId_sinResultados_retornaVacia() {
        when(paymentRepository.findPaymentsByEventId(99L)).thenReturn(List.of());
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of());

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByEventId(99L);

        assertThat(result).isNotNull().isEmpty();
    }

    // ─── getPaymentsByBookingId ──────────────────────────────────────────────

    @Test
    void getPaymentsByBookingId_existente_retornaColeccion() {
        when(paymentRepository.findPaymentsByBookingId(1L)).thenReturn(List.of(savedModel("APPROVED")));
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of(responseDTO("APPROVED")));

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByBookingId(1L);

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getPaymentsByBookingId_sinResultados_retornaVacia() {
        when(paymentRepository.findPaymentsByBookingId(99L)).thenReturn(List.of());
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of());

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByBookingId(99L);

        assertThat(result).isNotNull().isEmpty();
    }

    // ─── getPaymentsByStatus ─────────────────────────────────────────────────

    @Test
    void getPaymentsByStatus_aprobados_retornaColeccion() {
        when(paymentRepository.findPaymentsByStatus("APPROVED")).thenReturn(List.of(savedModel("APPROVED")));
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of(responseDTO("APPROVED")));

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByStatus("APPROVED");

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getPaymentsByStatus_rechazados_retornaColeccion() {
        when(paymentRepository.findPaymentsByStatus("REJECTED")).thenReturn(List.of(savedModel("REJECTED")));
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of(responseDTO("REJECTED")));

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByStatus("REJECTED");

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getPaymentsByStatus_estadoInexistente_retornaVacia() {
        when(paymentRepository.findPaymentsByStatus("UNKNOWN")).thenReturn(List.of());
        when(servicePaymentMapper.toResponseDTOList(any())).thenReturn(List.of());

        Collection<PaymentResponseDTO> result = paymentService.getPaymentsByStatus("UNKNOWN");

        assertThat(result).isNotNull().isEmpty();
    }
}
