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

class EventClientTest {

    private static final String STOCK_3 =
            "http://event-service:8081/api/v1/events/3/stock?quantity=2";

    private MockRestServiceServer server;
    private EventClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder =
                RestClientConfig.clientBuilder("http://event-service:8081", "Event");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new EventClient(builder.build());
    }

    private void respond(HttpStatus status, String problemDetail) {
        server.expect(requestTo(STOCK_3))
                .andExpect(method(PATCH))
                .andRespond(
                        withStatus(status)
                                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                                .body(problemDetail));
    }

    @Test
    void decrementStock_200ConCuerpo_completaSinError() {
        server.expect(requestTo(STOCK_3))
                .andExpect(method(PATCH))
                .andRespond(
                        withSuccess(
                                """
                        {"id":3,"title":"Obra de Teatro: La Espera","availableTickets":2,
                         "createdAt":"2026-01-01T00:00:00","updatedAt":"2026-01-01T00:00:00"}
                        """,
                                MediaType.APPLICATION_JSON));

        assertThatCode(() -> client.decrementStock(3L, 2)).doesNotThrowAnyException();
        server.verify();
    }

    @Test
    void decrementStock_404ConProblemDetail_lanzaResourceNotFoundConElDetalleRemoto() {
        respond(HttpStatus.NOT_FOUND, "{\"status\":404,\"detail\":\"Event with id 3 not found\"}");

        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event with id 3 not found");
    }

    @Test
    void decrementStock_404SinCuerpo_lanzaResourceNotFoundConMensajeGenerico() {
        server.expect(requestTo(STOCK_3)).andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event resource not found");
    }

    @Test
    void decrementStock_404ConCuerpoNoJson_lanzaResourceNotFoundConMensajeGenerico() {
        server.expect(requestTo(STOCK_3))
                .andRespond(
                        withStatus(HttpStatus.NOT_FOUND)
                                .contentType(MediaType.TEXT_HTML)
                                .body("<html>nope</html>"));

        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event resource not found");
    }

    @Test
    void decrementStock_422StockInsuficiente_lanzaBusinessConElDetalleRemoto() {
        respond(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "{\"status\":422,\"detail\":\"Insufficient stock for event 3: available 4, requested 5\"}");

        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Insufficient stock for event 3: available 4, requested 5");
    }

    @Test
    void decrementStock_409_lanzaBusinessConElDetalleRemoto() {
        respond(HttpStatus.CONFLICT, "{\"detail\":\"Some rule failed\"}");

        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Some rule failed");
    }

    @Test
    void decrementStock_400SinDetalle_lanzaBusinessConMensajeGenerico() {
        server.expect(requestTo(STOCK_3)).andRespond(withStatus(HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Event service rejected the request with status 400");
    }

    @ParameterizedTest
    @EnumSource(
            value = HttpStatus.class,
            names = {"INTERNAL_SERVER_ERROR", "SERVICE_UNAVAILABLE"})
    void decrementStock_5xx_lanzaRemoteServiceException(HttpStatus status) {
        respond(status, "{\"detail\":\"internal secret\"}");

        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("Event service is unavailable");
    }

    @Test
    void decrementStock_timeout_lanzaRemoteServiceException() {
        server.expect(requestTo(STOCK_3))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("Event service is unavailable");
    }
}
