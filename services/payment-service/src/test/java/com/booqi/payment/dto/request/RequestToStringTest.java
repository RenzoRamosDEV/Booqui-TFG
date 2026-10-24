package com.booqi.payment.dto.request;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class RequestToStringTest {

    private static final String CARD = "4111111111111112";

    @Test
    void createPaymentRequest_enmascaraTarjetaYCvv() {
        String text = new CreatePaymentRequest(1L, 3L, 2L, 2, new BigDecimal("70.00"), "CREDIT_CARD", CARD, "123")
                .toString();

        assertThat(text).doesNotContain(CARD).doesNotContain("cvv=123")
                .contains("cardNumber=***").contains("cvv=***")
                .contains("bookingId=1").contains("paymentMethod=CREDIT_CARD");
    }
}
