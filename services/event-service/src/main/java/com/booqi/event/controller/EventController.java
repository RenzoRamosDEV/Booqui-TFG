package com.booqi.event.controller;

import com.booqi.event.dto.request.CreateEventRequest;
import com.booqi.event.dto.request.EventFilter;
import com.booqi.event.dto.request.UpdateEventRequest;
import com.booqi.event.dto.response.EventResponse;
import com.booqi.event.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@Tag(name = "Events", description = "Creation, lookup, filtering, update, deletion and ticket-stock management of Booqi events")
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @Operation(summary = "Create an event", description = "contactEmail must be unique; endDate must not precede startDate")
    @ApiResponse(responseCode = "201", description = "Event created; Location points to the new resource")
    @ApiResponse(responseCode = "400", description = "Validation failed or malformed body")
    @ApiResponse(responseCode = "409", description = "contactEmail already in use")
    @ApiResponse(responseCode = "422", description = "endDate before startDate")
    @PostMapping
    public ResponseEntity<EventResponse> create(@Valid @RequestBody CreateEventRequest request) {
        EventResponse created = eventService.create(request);
        return ResponseEntity.created(URI.create("/api/v1/events/" + created.id())).body(created);
    }

    @Operation(summary = "List events", description = "Optional filters; only one at a time, blank values are ignored")
    @ApiResponse(responseCode = "200", description = "Matching events (possibly empty)")
    @ApiResponse(responseCode = "400", description = "More than one filter supplied")
    @GetMapping
    public ResponseEntity<List<EventResponse>> findAll(@ParameterObject @ModelAttribute EventFilter filter) {
        return ResponseEntity.ok(eventService.findAll(filter));
    }

    @Operation(summary = "Get an event by id")
    @ApiResponse(responseCode = "200", description = "Event found")
    @ApiResponse(responseCode = "400", description = "Non-numeric id")
    @ApiResponse(responseCode = "404", description = "Event not found")
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.findById(id));
    }

    @Operation(summary = "Update an event", description = "Only the non-null fields are applied")
    @ApiResponse(responseCode = "200", description = "Event updated")
    @ApiResponse(responseCode = "400", description = "Validation failed or malformed body")
    @ApiResponse(responseCode = "404", description = "Event not found")
    @ApiResponse(responseCode = "409", description = "contactEmail already in use")
    @ApiResponse(responseCode = "422", description = "Dates out of order or negative tickets")
    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateEventRequest request) {
        return ResponseEntity.ok(eventService.update(id, request));
    }

    @Operation(summary = "Delete an event")
    @ApiResponse(responseCode = "204", description = "Event deleted")
    @ApiResponse(responseCode = "404", description = "Event not found")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Decrement the ticket stock of an event")
    @ApiResponse(responseCode = "200", description = "Stock decremented; returns the updated event")
    @ApiResponse(responseCode = "400", description = "Missing or non-numeric quantity")
    @ApiResponse(responseCode = "404", description = "Event not found")
    @ApiResponse(responseCode = "422", description = "Quantity not positive or insufficient stock")
    @PatchMapping("/{id}/stock")
    public ResponseEntity<EventResponse> decrementStock(@PathVariable Long id, @RequestParam Integer quantity) {
        return ResponseEntity.ok(eventService.decrementStock(id, quantity));
    }
}
