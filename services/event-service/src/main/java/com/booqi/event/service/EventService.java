package com.booqi.event.service;

import com.booqi.event.dto.request.CreateEventRequest;
import com.booqi.event.dto.request.EventFilter;
import com.booqi.event.dto.request.UpdateEventRequest;
import com.booqi.event.dto.response.EventResponse;

import java.util.List;

public interface EventService {

    List<EventResponse> findAll();

    List<EventResponse> findAll(EventFilter filter);

    EventResponse findById(Long id);

    EventResponse create(CreateEventRequest request);

    EventResponse update(Long id, UpdateEventRequest request);

    void delete(Long id);

    boolean existsById(Long id);

    List<EventResponse> findByContactEmail(String contactEmail);

    List<EventResponse> findByTitle(String title);

    List<EventResponse> findByCategory(String category);

    List<EventResponse> findByLocation(String location);

    List<EventResponse> findByOrganizer(String organizer);

    EventResponse decrementStock(Long id, Integer quantity);
}
