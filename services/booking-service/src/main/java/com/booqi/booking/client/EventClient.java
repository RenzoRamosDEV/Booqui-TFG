package com.booqi.booking.client;

import com.booqi.booking.client.dto.EventResponse;
import com.booqi.booking.exception.RemoteServiceException;
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

    public EventResponse findById(Long id) {
        try {
            return restClient.get().uri("/api/v1/events/{id}", id).retrieve().body(EventResponse.class);
        } catch (ResourceAccessException e) {
            throw new RemoteServiceException("Event service is unavailable", e);
        }
    }
}
