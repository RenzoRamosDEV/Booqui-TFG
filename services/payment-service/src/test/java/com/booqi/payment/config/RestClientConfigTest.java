package com.booqi.payment.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

import com.booqi.payment.client.BookingClient;
import com.booqi.payment.client.EventClient;
import com.booqi.payment.exception.RemoteServiceException;
import com.booqi.payment.exception.ResourceNotFoundException;
import com.sun.net.httpserver.HttpServer;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.time.Duration;

class RestClientConfigTest {

    private static EventClient clientFor(int port) {
        return new EventClient(
                RestClientConfig.clientBuilder("http://127.0.0.1:" + port, "Event").build());
    }

    @Test
    void servidorQueNoResponde_cortaPorReadTimeoutEntre5y8Segundos() throws IOException {
        try (ServerSocket silent = new ServerSocket(0, 50, InetAddress.getLoopbackAddress())) {
            EventClient client = clientFor(silent.getLocalPort());
            long start = System.nanoTime();

            assertTimeoutPreemptively(
                    Duration.ofSeconds(8),
                    () ->
                            assertThatThrownBy(() -> client.decrementStock(3L, 2))
                                    .isInstanceOf(RemoteServiceException.class)
                                    .hasMessage("Event service is unavailable"));

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
        EventClient client = clientFor(port);

        assertTimeoutPreemptively(
                Duration.ofSeconds(3),
                () ->
                        assertThatThrownBy(() -> client.decrementStock(3L, 2))
                                .isInstanceOf(RemoteServiceException.class)
                                .hasMessage("Event service is unavailable"));
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
            EventClient eventClient = new EventClient(config.eventRestClient(baseUrl));
            BookingClient bookingClient = new BookingClient(config.bookingRestClient(baseUrl));

            assertThatThrownBy(() -> eventClient.decrementStock(3L, 2))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Event resource not found");
            assertThatThrownBy(() -> bookingClient.confirm(7L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Booking resource not found");
        } finally {
            server.stop(0);
        }
    }
}
