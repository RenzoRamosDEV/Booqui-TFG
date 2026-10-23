package com.booqi.booking.service.impl;

import com.booqi.booking.client.EventClient;
import com.booqi.booking.client.UserClient;
import com.booqi.booking.client.dto.EventResponse;
import com.booqi.booking.client.dto.UserResponse;
import com.booqi.booking.dto.request.BookingFilter;
import com.booqi.booking.dto.request.CreateBookingRequest;
import com.booqi.booking.dto.response.BookingResponse;
import com.booqi.booking.entity.Booking;
import com.booqi.booking.exception.InvalidFilterException;
import com.booqi.booking.exception.ResourceNotFoundException;
import com.booqi.booking.mapper.BookingMapper;
import com.booqi.booking.repository.BookingRepository;
import com.booqi.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingServiceImpl implements BookingService {

    static final String SINGLE_FILTER_MESSAGE = "Only one filter may be used at a time";

    private static final String PENDING = "PENDING";
    private static final String CONFIRMED = "CONFIRMED";
    private static final String CANCELLED = "CANCELLED";

    private final BookingRepository bookingRepository;
    private final BookingMapper bookingMapper;
    private final UserClient userClient;
    private final EventClient eventClient;

    @Override
    public List<BookingResponse> findAll() {
        return bookingMapper.toResponseList(bookingRepository.findAll());
    }

    @Override
    public List<BookingResponse> findAll(BookingFilter filter) {
        boolean byUser = filter.userId() != null;
        boolean byEvent = filter.eventId() != null;
        boolean byStatus = StringUtils.hasText(filter.status());
        if (countTrue(byUser, byEvent, byStatus) > 1) {
            throw new InvalidFilterException(SINGLE_FILTER_MESSAGE);
        }
        if (byUser) {
            log.debug("Listing bookings filtered by userId");
            return findByUserId(filter.userId());
        }
        if (byEvent) {
            log.debug("Listing bookings filtered by eventId");
            return findByEventId(filter.eventId());
        }
        if (byStatus) {
            log.debug("Listing bookings filtered by status");
            return findByStatus(filter.status());
        }
        return findAll();
    }

    @Override
    public BookingResponse findById(Long id) {
        return bookingMapper.toResponse(getBooking(id));
    }

    @Override
    @Transactional
    public BookingResponse create(CreateBookingRequest request) {
        UserResponse user = userClient.findById(request.userId());
        EventResponse event = eventClient.findById(request.eventId());
        BigDecimal basePrice = BigDecimal.valueOf(event.price());
        Booking booking = Booking.builder()
                .userId(user.id())
                .userFirstName(user.firstName())
                .userLastName(user.lastName())
                .userEmail(user.contactEmail())
                .eventId(event.id())
                .eventTitle(event.title())
                .eventDescription(event.description())
                .eventStartDate(event.startDate())
                .eventLocation(event.location())
                .ticketQuantity(request.ticketQuantity())
                .basePrice(basePrice)
                .totalPrice(basePrice.multiply(BigDecimal.valueOf(request.ticketQuantity())))
                .status(PENDING)
                .build();
        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} created for user {} and event {}", saved.getId(), saved.getUserId(), saved.getEventId());
        return bookingMapper.toResponse(saved);
    }

    @Override
    public boolean existsById(Long id) {
        return bookingRepository.existsById(id);
    }

    @Override
    public List<BookingResponse> findByUserId(Long userId) {
        return bookingMapper.toResponseList(bookingRepository.findByUserId(userId));
    }

    @Override
    public List<BookingResponse> findByEventId(Long eventId) {
        return bookingMapper.toResponseList(bookingRepository.findByEventId(eventId));
    }

    @Override
    public List<BookingResponse> findByStatus(String status) {
        return bookingMapper.toResponseList(bookingRepository.findByStatus(status));
    }

    @Override
    @Transactional
    public BookingResponse confirm(Long id) {
        return changeStatus(id, CONFIRMED);
    }

    @Override
    @Transactional
    public BookingResponse cancel(Long id) {
        return changeStatus(id, CANCELLED);
    }

    private BookingResponse changeStatus(Long id, String target) {
        Booking booking = getBooking(id);
        if (target.equals(booking.getStatus())) {
            log.debug("Booking {} already {}", id, target);
            return bookingMapper.toResponse(booking);
        }
        booking.setStatus(target);
        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} changed to {}", id, target);
        return bookingMapper.toResponse(saved);
    }

    private Booking getBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking with id " + id + " not found"));
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
