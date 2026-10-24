package com.booqi.booking.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

import com.booqi.booking.client.EventClient;
import com.booqi.booking.client.UserClient;
import com.booqi.booking.exception.RemoteServiceException;
import com.booqi.booking.exception.ResourceNotFoundException;
import com.sun.net.httpserver.HttpServer;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.time.Duration;

class RestClientConfigTest {

    private static UserClient clientFor(int port) {
        return new UserClient(
                RestClientConfig.clientBuilder("http://127.0.0.1:" + port, "User").build());
    }

    @Test
    void servidorQueNoResponde_cortaPorReadTimeoutEntre5y8Segundos() throws IOException {
        try (ServerSocket silent = new ServerSocket(0, 50, InetAddress.getLoopbackAddress())) {
            UserClient client = clientFor(silent.getLocalPort());
            long start = System.nanoTime();

            assertTimeoutPreemptively(
                    Duration.ofSeconds(8),
                    () ->
                            assertThatThrownBy(() -> client.findById(7L))
                                    .isInstanceOf(RemoteServiceException.class)
                                    .hasMessage("User service is unavailable"));

            assertThat(Duration.ofNanos(System.nanoTime() - start))
                    .isGreaterThanOrEqualTo(Duration.ofSeconds(5));
        }
    }

    @Test
    void puertoCerrado_lanzaRemoteServiceExceptionEnMenosDe3Segundos() throws IOException {
        int port;
        try (ServerSocket socket = new ServerSocket(0, 50, InetAddress.getLoopbackAddress())) {
            port = socket.getLocalPort();
        }
        UserClient client = clientFor(port);

        assertTimeoutPreemptively(
                Duration.ofSeconds(3),
                () ->
                        assertThatThrownBy(() -> client.findById(7L))
                                .isInstanceOf(RemoteServiceException.class)
                                .hasMessage("User service is unavailable"));
    }

    @Test
    void beans_usanLaUrlBaseConfiguradaYEtiquetanElServicio() throws IOException {
        HttpServer server =
                HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        server.createContext(
                "/",
                exchange -> {
                    exchange.sendResponseHeaders(404, -1);
                    exchange.close();
                });
        server.start();
        try {
            String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
            RestClientConfig config = new RestClientConfig();
            UserClient userClient = new UserClient(config.userRestClient(baseUrl));
            EventClient eventClient = new EventClient(config.eventRestClient(baseUrl));

            assertThatThrownBy(() -> userClient.findById(7L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("User resource not found");
            assertThatThrownBy(() -> eventClient.findById(3L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Event resource not found");
        } finally {
            server.stop(0);
        }
    }
}
