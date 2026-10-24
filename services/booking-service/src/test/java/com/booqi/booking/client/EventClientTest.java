package com.booqi.booking.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.booqi.booking.client.dto.EventResponse;
import com.booqi.booking.config.RestClientConfig;
import com.booqi.booking.exception.BusinessException;
import com.booqi.booking.exception.RemoteServiceException;
import com.booqi.booking.exception.ResourceNotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;
import java.time.LocalDateTime;

class EventClientTest {

    private static final String EVENT_3 = "http://event-service:8081/api/v1/events/3";

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
        server.expect(requestTo(EVENT_3))
                .andExpect(method(GET))
                .andRespond(
                        withStatus(status)
                                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                                .body(problemDetail));
    }

    @Test
    void findById_200_mapeaLosCamposUsados() {
        server.expect(requestTo(EVENT_3))
                .andExpect(method(GET))
                .andRespond(
                        withSuccess(
                                """
                        {"id":3,"title":"Obra de Teatro: La Espera","description":"Drama","availableTickets":4,
                         "location":"Teatro Gran Via, Madrid",
                         "startDate":"2026-03-20T20:30:00","endDate":"2026-03-20T22:30:00",
                         "organizer":"Producciones Escenicas S.L.","price":40.0,"category":"Cultura",
                         "contactEmail":"tickets@teatro.com","contactPhone":"910000003","imageUrl":null,
                         "createdAt":"2026-01-01T00:00:00","updatedAt":"2026-01-01T00:00:00"}
                        """,
                                MediaType.APPLICATION_JSON));

        EventResponse event = client.findById(3L);

        assertThat(event)
                .isEqualTo(
                        new EventResponse(
                                3L,
                                "Obra de Teatro: La Espera",
                                "Drama",
                                LocalDateTime.of(2026, 3, 20, 20, 30),
                                "Teatro Gran Via, Madrid",
                                40.0));
        server.verify();
    }

    @Test
    void findById_404ConProblemDetail_lanzaResourceNotFoundConElDetalleRemoto() {
        respond(HttpStatus.NOT_FOUND, "{\"status\":404,\"detail\":\"Event with id 3 not found\"}");

        assertThatThrownBy(() -> client.findById(3L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event with id 3 not found");
    }

    @Test
    void findById_404SinCuerpo_lanzaResourceNotFoundConMensajeGenerico() {
        server.expect(requestTo(EVENT_3)).andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> client.findById(3L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event resource not found");
    }

    @ParameterizedTest
    @EnumSource(
            value = HttpStatus.class,
            names = {"CONFLICT", "UNPROCESSABLE_CONTENT"})
    void findById_409o422_lanzaBusinessConElDetalleRemoto(HttpStatus status) {
        respond(status, "{\"detail\":\"Some rule failed\"}");

        assertThatThrownBy(() -> client.findById(3L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Some rule failed");
    }

    @Test
    void findById_400SinDetalle_lanzaBusinessConMensajeGenerico() {
        server.expect(requestTo(EVENT_3)).andRespond(withStatus(HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> client.findById(3L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Event service rejected the request with status 400");
    }

    @ParameterizedTest
    @EnumSource(
            value = HttpStatus.class,
            names = {"INTERNAL_SERVER_ERROR", "SERVICE_UNAVAILABLE"})
    void findById_5xx_lanzaRemoteServiceException(HttpStatus status) {
        respond(status, "{\"detail\":\"internal secret\"}");

        assertThatThrownBy(() -> client.findById(3L))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("Event service is unavailable");
    }

    @Test
    void findById_timeout_lanzaRemoteServiceException() {
        server.expect(requestTo(EVENT_3))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(() -> client.findById(3L))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("Event service is unavailable");
    }
}
