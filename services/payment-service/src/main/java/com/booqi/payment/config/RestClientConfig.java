package com.booqi.payment.config;

import com.booqi.payment.client.RemoteErrorHandler;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class RestClientConfig {

    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
    static final Duration READ_TIMEOUT = Duration.ofSeconds(5);

    @Bean
    public RestClient eventRestClient(@Value("${booqi.clients.event.base-url}") String baseUrl) {
        return clientBuilder(baseUrl, "Event").build();
    }

    @Bean
    public RestClient bookingRestClient(
            @Value("${booqi.clients.booking.base-url}") String baseUrl) {
        return clientBuilder(baseUrl, "Booking").build();
    }

    public static RestClient.Builder clientBuilder(String baseUrl, String target) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory())
                .defaultStatusHandler(HttpStatusCode::isError, new RemoteErrorHandler(target));
    }

    static JdkClientHttpRequestFactory requestFactory() {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(READ_TIMEOUT);
        return factory;
    }
}
