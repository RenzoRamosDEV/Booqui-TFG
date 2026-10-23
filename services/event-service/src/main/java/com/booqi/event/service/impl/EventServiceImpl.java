package com.booqi.event.service.impl;

import com.booqi.event.dto.request.CreateEventRequest;
import com.booqi.event.dto.request.EventFilter;
import com.booqi.event.dto.request.UpdateEventRequest;
import com.booqi.event.dto.response.EventResponse;
import com.booqi.event.entity.Event;
import com.booqi.event.exception.BusinessException;
import com.booqi.event.exception.ConflictException;
import com.booqi.event.exception.InvalidFilterException;
import com.booqi.event.exception.ResourceNotFoundException;
import com.booqi.event.mapper.EventMapper;
import com.booqi.event.repository.EventRepository;
import com.booqi.event.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Function;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    static final String SINGLE_FILTER_MESSAGE = "Only one filter may be used at a time";

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    @Override
    public List<EventResponse> findAll() {
        return eventMapper.toResponseList(eventRepository.findAll());
    }

    @Override
    public List<EventResponse> findAll(EventFilter filter) {
        boolean byEmail = StringUtils.hasText(filter.contactEmail());
        boolean byTitle = StringUtils.hasText(filter.title());
        boolean byCategory = StringUtils.hasText(filter.category());
        boolean byLocation = StringUtils.hasText(filter.location());
        boolean byOrganizer = StringUtils.hasText(filter.organizer());
        if (countTrue(byEmail, byTitle, byCategory, byLocation, byOrganizer) > 1) {
            throw new InvalidFilterException(SINGLE_FILTER_MESSAGE);
        }
        if (byEmail) {
            log.debug("Listing events filtered by contactEmail");
            return findByContactEmail(filter.contactEmail());
        }
        if (byTitle) {
            log.debug("Listing events filtered by title");
            return findByTitle(filter.title());
        }
        if (byCategory) {
            log.debug("Listing events filtered by category");
            return findByCategory(filter.category());
        }
        if (byLocation) {
            log.debug("Listing events filtered by location");
            return findByLocation(filter.location());
        }
        if (byOrganizer) {
            log.debug("Listing events filtered by organizer");
            return findByOrganizer(filter.organizer());
        }
        return findAll();
    }

    @Override
    public EventResponse findById(Long id) {
        return eventMapper.toResponse(getEvent(id));
    }

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request) {
        if (eventRepository.existsByContactEmail(request.contactEmail())) {
            throw duplicateEmail(request.contactEmail());
        }
        requireEndNotBeforeStart(request.startDate(), request.endDate());
        Event saved = eventRepository.save(eventMapper.toEntity(request));
        log.info("Event {} created", saved.getId());
        return eventMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public EventResponse update(Long id, UpdateEventRequest request) {
        Event event = getEvent(id);
        String newEmail = request.contactEmail();
        if (newEmail != null && !newEmail.equals(event.getContactEmail())
                && eventRepository.existsByContactEmail(newEmail)) {
            throw duplicateEmail(newEmail);
        }
        validateUpdatedDates(request, event);
        if (request.availableTickets() != null && request.availableTickets() < 0) {
            throw new BusinessException("Available tickets cannot be negative");
        }
        eventMapper.updateEntity(request, event);
        Event saved = eventRepository.save(event);
        log.info("Event {} updated", id);
        return eventMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!eventRepository.existsById(id)) {
            throw notFound(id);
        }
        eventRepository.deleteById(id);
        log.info("Event {} deleted", id);
    }

    @Override
    public boolean existsById(Long id) {
        return eventRepository.existsById(id);
    }

    @Override
    public List<EventResponse> findByContactEmail(String contactEmail) {
        if (!StringUtils.hasText(contactEmail)) {
            return List.of();
        }
        return eventRepository.findByContactEmail(contactEmail)
                .map(event -> List.of(eventMapper.toResponse(event)))
                .orElse(List.of());
    }

    @Override
    public List<EventResponse> findByTitle(String title) {
        return findByTextOrAll(title, eventRepository::findByTitleContainingIgnoreCase);
    }

    @Override
    public List<EventResponse> findByCategory(String category) {
        return findByTextOrAll(category, eventRepository::findByCategoryIgnoreCase);
    }

    @Override
    public List<EventResponse> findByLocation(String location) {
        return findByTextOrAll(location, eventRepository::findByLocationContainingIgnoreCase);
    }

    @Override
    public List<EventResponse> findByOrganizer(String organizer) {
        return findByTextOrAll(organizer, eventRepository::findByOrganizerContainingIgnoreCase);
    }

    @Override
    @Transactional
    public EventResponse decrementStock(Long id, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BusinessException("Quantity must be greater than zero");
        }
        Event event = getEvent(id);
        Integer available = event.getAvailableTickets();
        if (available == null) {
            throw new BusinessException("Event " + id + " has no stock configured");
        }
        if (available < quantity) {
            throw new BusinessException("Insufficient stock for event " + id
                    + ": available " + available + ", requested " + quantity);
        }
        event.setAvailableTickets(available - quantity);
        Event saved = eventRepository.save(event);
        log.info("Event {} stock decremented by {}", id, quantity);
        return eventMapper.toResponse(saved);
    }

    private List<EventResponse> findByTextOrAll(String text, Function<String, List<Event>> query) {
        if (!StringUtils.hasText(text)) {
            return findAll();
        }
        return eventMapper.toResponseList(query.apply(text));
    }

    private static void validateUpdatedDates(UpdateEventRequest request, Event event) {
        LocalDateTime newStart = request.startDate();
        LocalDateTime newEnd = request.endDate();
        if (newStart != null && newEnd != null) {
            requireEndNotBeforeStart(newStart, newEnd);
        } else if (newStart != null && event.getEndDate().isBefore(newStart)) {
            throw new BusinessException("New start date cannot be after the existing end date");
        } else if (newEnd != null && newEnd.isBefore(event.getStartDate())) {
            throw new BusinessException("New end date cannot be before the existing start date");
        }
    }

    private static void requireEndNotBeforeStart(LocalDateTime startDate, LocalDateTime endDate) {
        if (endDate.isBefore(startDate)) {
            throw new BusinessException("End date cannot be before start date");
        }
    }

    private Event getEvent(Long id) {
        return eventRepository.findById(id).orElseThrow(() -> notFound(id));
    }

    private static ResourceNotFoundException notFound(Long id) {
        return new ResourceNotFoundException("Event with id " + id + " not found");
    }

    private static ConflictException duplicateEmail(String contactEmail) {
        return new ConflictException("Event with contactEmail " + contactEmail + " already exists");
    }

    private static long countTrue(boolean... conditions) {
        long count = 0;
        for (boolean condition : conditions) {
            if (condition) {
                count++;
            }
        }
        return count;
    }
}
