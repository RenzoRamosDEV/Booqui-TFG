package com.booqi.booking.client;

import com.booqi.booking.client.dto.UserResponse;
import com.booqi.booking.exception.RemoteServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

@Component
public class UserClient {

    private final RestClient restClient;

    public UserClient(@Qualifier("userRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public UserResponse findById(Long id) {
        try {
            return restClient.get().uri("/api/v1/users/{id}", id).retrieve().body(UserResponse.class);
        } catch (ResourceAccessException e) {
            throw new RemoteServiceException("User service is unavailable", e);
        }
    }
}
