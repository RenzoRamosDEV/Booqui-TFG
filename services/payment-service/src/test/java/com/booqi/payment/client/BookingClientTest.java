package com.booqi.payment.client;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.HttpMethod.PATCH;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.booqi.payment.config.RestClientConfig;
import com.booqi.payment.exception.BusinessException;
import com.booqi.payment.exception.RemoteServiceException;
import com.booqi.payment.exception.ResourceNotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;

class BookingClientTest {

    private static final String BOOKING_7 = "http://booking-service:8082/api/v1/bookings/7";

    private MockRestServiceServer server;
    private BookingClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder =
                RestClientConfig.clientBuilder("http://booking-service:8082", "Booking");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new BookingClient(builder.build());
    }

    private static String bookingBody(String status) {
        return """
                {"id":7,"userId":3,"eventId":2,"ticketQuantity":2,"basePrice":35.00,"totalPrice":70.00,
                 "status":"%s","createdAt":"2026-01-01T10:00:00","updatedAt":"2026-01-01T10:00:00"}
                """
                .formatted(status);
    }

    @Test
    void confirm_200ConCuerpo_llamaAlPatchV1() {
        server.expect(requestTo(BOOKING_7 + "/confirm"))
                .andExpect(method(PATCH))
                .andRespond(withSuccess(bookingBody("CONFIRMED"), MediaType.APPLICATION_JSON));

        assertThatCode(() -> client.confirm(7L)).doesNotThrowAnyException();
        server.verify();
    }

    @Test
    void cancel_200ConCuerpo_llamaAlPatchV1() {
        server.expect(requestTo(BOOKING_7 + "/cancel"))
                .andExpect(method(PATCH))
                .andRespond(withSuccess(bookingBody("CANCELLED"), MediaType.APPLICATION_JSON));

        assertThatCode(() -> client.cancel(7L)).doesNotThrowAnyException();
        server.verify();
    }

    @Test
    void confirm_404ConProblemDetail_lanzaResourceNotFoundConElDetalleRemoto() {
        server.expect(requestTo(BOOKING_7 + "/confirm"))
                .andExpect(method(PATCH))
                .andRespond(
                        withStatus(HttpStatus.NOT_FOUND)
                                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                                .body(
                                        "{\"status\":404,\"detail\":\"Booking with id 7 not found\"}"));

        assertThatThrownBy(() -> client.confirm(7L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Booking with id 7 not found");
    }

    @ParameterizedTest
    @EnumSource(
            value = HttpStatus.class,
            names = {"BAD_REQUEST", "CONFLICT", "UNPROCESSABLE_CONTENT"})
    void cancel_4xx_lanzaBusinessConMensajeGenerico(HttpStatus status) {
        server.expect(requestTo(BOOKING_7 + "/cancel")).andRespond(withStatus(status));

        assertThatThrownBy(() -> client.cancel(7L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Booking service rejected the request with status " + status.value());
    }

    @ParameterizedTest
    @EnumSource(
            value = HttpStatus.class,
            names = {"INTERNAL_SERVER_ERROR", "SERVICE_UNAVAILABLE"})
    void confirm_5xx_lanzaRemoteServiceException(HttpStatus status) {
        server.expect(requestTo(BOOKING_7 + "/confirm")).andRespond(withStatus(status));

        assertThatThrownBy(() -> client.confirm(7L))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("Booking service is unavailable");
    }

    @Test
    void confirm_timeout_lanzaRemoteServiceException() {
        server.expect(requestTo(BOOKING_7 + "/confirm"))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(() -> client.confirm(7L))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("Booking service is unavailable");
    }

    @Test
    void cancel_timeout_lanzaRemoteServiceException() {
        server.expect(requestTo(BOOKING_7 + "/cancel"))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(() -> client.cancel(7L))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("Booking service is unavailable");
    }
}
