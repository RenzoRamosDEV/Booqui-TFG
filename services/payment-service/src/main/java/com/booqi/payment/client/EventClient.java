package com.booqi.payment.client;

import com.booqi.payment.exception.RemoteServiceException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

@Component
public class EventClient {

    private final RestClient restClient;

    public EventClient(@Qualifier("eventRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public void decrementStock(Long id, Integer quantity) {
        try {
            restClient
                    .patch()
                    .uri("/api/v1/events/{id}/stock?quantity={quantity}", id, quantity)
                    .retrieve()
                    .toBodilessEntity();
        } catch (ResourceAccessException e) {
            throw new RemoteServiceException("Event service is unavailable", e);
        }
    }
}
