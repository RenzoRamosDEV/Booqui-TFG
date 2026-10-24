package com.booqi.payment.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.booqi.payment.dto.response.PaymentResponse;
import com.booqi.payment.entity.Payment;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

class PaymentMapperTest {

    private static final LocalDateTime PAID = LocalDateTime.of(2026, 1, 1, 10, 0, 5);
    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 1, 1, 10, 0);
    private static final LocalDateTime UPDATED = LocalDateTime.of(2026, 1, 2, 11, 30);

    private final PaymentMapper mapper = new PaymentMapperImpl();

    private Payment entity() {
        return Payment.builder()
                .id(5L)
                .bookingId(1L)
                .userId(3L)
                .eventId(2L)
                .ticketQuantity(2)
                .totalPrice(new BigDecimal("70.00"))
                .paymentMethod("PAYPAL")
                .status("APPROVED")
                .transactionId("tx-1")
                .errorMessage("none")
                .paymentDate(PAID)
                .createdAt(CREATED)
                .updatedAt(UPDATED)
                .build();
    }

    @Test
    void toResponse_copiaTodosLosCampos() {
        PaymentResponse response = mapper.toResponse(entity());

        assertThat(response.id()).isEqualTo(5L);
        assertThat(response.bookingId()).isEqualTo(1L);
        assertThat(response.userId()).isEqualTo(3L);
        assertThat(response.eventId()).isEqualTo(2L);
        assertThat(response.ticketQuantity()).isEqualTo(2);
        assertThat(response.totalPrice()).isEqualByComparingTo("70.00");
        assertThat(response.paymentMethod()).isEqualTo("PAYPAL");
        assertThat(response.status()).isEqualTo("APPROVED");
        assertThat(response.transactionId()).isEqualTo("tx-1");
        assertThat(response.errorMessage()).isEqualTo("none");
        assertThat(response.paymentDate()).isEqualTo(PAID);
        assertThat(response.createdAt()).isEqualTo(CREATED);
        assertThat(response.updatedAt()).isEqualTo(UPDATED);
    }

    @Test
    void paymentResponse_tieneExactamenteLosCamposDelContrato() {
        assertThat(PaymentResponse.class.getDeclaredFields())
                .extracting(Field::getName)
                .containsExactlyInAnyOrder(
                        "id",
                        "bookingId",
                        "userId",
                        "eventId",
                        "ticketQuantity",
                        "totalPrice",
                        "paymentMethod",
                        "status",
                        "transactionId",
                        "errorMessage",
                        "paymentDate",
                        "createdAt",
                        "updatedAt");
    }

    @Test
    void toResponseList_mapeaCadaElemento() {
        List<PaymentResponse> responses = mapper.toResponseList(List.of(entity(), entity()));

        assertThat(responses).hasSize(2).extracting(PaymentResponse::id).containsExactly(5L, 5L);
    }

    @Test
    void toResponseList_listaVacia() {
        assertThat(mapper.toResponseList(List.of())).isEmpty();
    }
}
