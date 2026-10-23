package org.service_payment.payment.client;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.springframework.http.HttpMethod.PATCH;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class BookingServiceClientTest {

    private static final String BOOKINGS_V1 = "http://booking-service:8082/api/v1/bookings";

    private MockRestServiceServer server;
    private BookingServiceClient client;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        client = new BookingServiceClient(restTemplate, BOOKINGS_V1);
    }

    private static String bookingBody(String status) {
        return """
                {"id":7,"userId":3,"eventId":2,"ticketQuantity":2,"basePrice":35.00,"totalPrice":70.00,
                 "status":"%s","createdAt":"2026-01-01T10:00:00","updatedAt":"2026-01-01T10:00:00"}
                """.formatted(status);
    }

    @Test
    void confirmBooking_llamaAlPatchV1YAceptaElCuerpoDeLaReserva() {
        server.expect(requestTo(BOOKINGS_V1 + "/7/confirm")).andExpect(method(PATCH))
                .andRespond(withSuccess(bookingBody("CONFIRMED"), MediaType.APPLICATION_JSON));

        assertThatNoException().isThrownBy(() -> client.confirmBooking(7L));
        server.verify();
    }

    @Test
    void cancelBooking_llamaAlPatchV1YAceptaElCuerpoDeLaReserva() {
        server.expect(requestTo(BOOKINGS_V1 + "/7/cancel")).andExpect(method(PATCH))
                .andRespond(withSuccess(bookingBody("CANCELLED"), MediaType.APPLICATION_JSON));

        assertThatNoException().isThrownBy(() -> client.cancelBooking(7L));
        server.verify();
    }
}
