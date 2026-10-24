package com.booqi.booking.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.booqi.booking.client.dto.UserResponse;
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

class UserClientTest {

    private static final String USER_7 = "http://user-service:8080/api/v1/users/7";

    private MockRestServiceServer server;
    private UserClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder =
                RestClientConfig.clientBuilder("http://user-service:8080", "User");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new UserClient(builder.build());
    }

    private void respond(HttpStatus status, String problemDetail) {
        server.expect(requestTo(USER_7))
                .andExpect(method(GET))
                .andRespond(
                        withStatus(status)
                                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                                .body(problemDetail));
    }

    @Test
    void findById_200_mapeaLosCamposUsados() {
        server.expect(requestTo(USER_7))
                .andExpect(method(GET))
                .andRespond(
                        withSuccess(
                                """
                        {"id":7,"firstName":"Mel","lastName":"Admin","contactEmail":"mel@booqi.com","role":"ADMIN",
                         "createdAt":"2026-01-01T00:00:00","updatedAt":"2026-01-01T00:00:00"}
                        """,
                                MediaType.APPLICATION_JSON));

        UserResponse user = client.findById(7L);

        assertThat(user).isEqualTo(new UserResponse(7L, "Mel", "Admin", "mel@booqi.com"));
        server.verify();
    }

    @Test
    void findById_404ConProblemDetail_lanzaResourceNotFoundConElDetalleRemoto() {
        respond(
                HttpStatus.NOT_FOUND,
                """
                {"type":"about:blank","title":"Not Found","status":404,"detail":"User with id 7 not found",
                 "instance":"/api/v1/users/7"}
                """);

        assertThatThrownBy(() -> client.findById(7L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User with id 7 not found");
    }

    @Test
    void findById_404SinCuerpo_lanzaResourceNotFoundConMensajeGenerico() {
        server.expect(requestTo(USER_7)).andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> client.findById(7L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User resource not found");
    }

    @Test
    void findById_404ConCuerpoNoJson_usaElMensajeGenerico() {
        server.expect(requestTo(USER_7))
                .andRespond(
                        withStatus(HttpStatus.NOT_FOUND)
                                .contentType(MediaType.TEXT_HTML)
                                .body("<html>nope</html>"));

        assertThatThrownBy(() -> client.findById(7L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User resource not found");
    }

    @ParameterizedTest
    @EnumSource(
            value = HttpStatus.class,
            names = {"CONFLICT", "UNPROCESSABLE_CONTENT"})
    void findById_409o422_lanzaBusinessConElDetalleRemoto(HttpStatus status) {
        respond(status, "{\"status\":" + status.value() + ",\"detail\":\"Some rule failed\"}");

        assertThatThrownBy(() -> client.findById(7L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Some rule failed");
    }

    @Test
    void findById_400SinDetalle_lanzaBusinessConMensajeGenerico() {
        respond(HttpStatus.BAD_REQUEST, "{\"status\":400}");

        assertThatThrownBy(() -> client.findById(7L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("User service rejected the request with status 400");
    }

    @ParameterizedTest
    @EnumSource(
            value = HttpStatus.class,
            names = {"INTERNAL_SERVER_ERROR", "SERVICE_UNAVAILABLE"})
    void findById_5xx_lanzaRemoteServiceException(HttpStatus status) {
        respond(status, "{\"detail\":\"internal secret\"}");

        assertThatThrownBy(() -> client.findById(7L))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("User service is unavailable");
    }

    @Test
    void findById_timeout_lanzaRemoteServiceException() {
        server.expect(requestTo(USER_7))
                .andRespond(withException(new SocketTimeoutException("Read timed out")));

        assertThatThrownBy(() -> client.findById(7L))
                .isInstanceOf(RemoteServiceException.class)
                .hasMessage("User service is unavailable")
                .hasRootCauseInstanceOf(SocketTimeoutException.class);
    }
}
