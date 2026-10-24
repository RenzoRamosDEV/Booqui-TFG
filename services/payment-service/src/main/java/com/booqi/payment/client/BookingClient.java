package com.booqi.payment.client;

import com.booqi.payment.exception.RemoteServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

@Component
public class BookingClient {

    private final RestClient restClient;

    public BookingClient(@Qualifier("bookingRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public void confirm(Long id) {
        changeStatus(id, "confirm");
    }

    public void cancel(Long id) {
        changeStatus(id, "cancel");
    }

    private void changeStatus(Long id, String action) {
        try {
            restClient.patch().uri("/api/v1/bookings/{id}/{action}", id, action).retrieve().toBodilessEntity();
        } catch (ResourceAccessException e) {
            throw new RemoteServiceException("Booking service is unavailable", e);
        }
    }
}
