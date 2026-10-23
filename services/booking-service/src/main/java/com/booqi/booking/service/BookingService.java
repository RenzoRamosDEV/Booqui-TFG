package com.booqi.booking.service;

import com.booqi.booking.dto.request.BookingFilter;
import com.booqi.booking.dto.request.CreateBookingRequest;
import com.booqi.booking.dto.response.BookingResponse;

import java.util.List;

public interface BookingService {

    List<BookingResponse> findAll();

    List<BookingResponse> findAll(BookingFilter filter);

    BookingResponse findById(Long id);

    BookingResponse create(CreateBookingRequest request);

    boolean existsById(Long id);

    List<BookingResponse> findByUserId(Long userId);

    List<BookingResponse> findByEventId(Long eventId);

    List<BookingResponse> findByStatus(String status);

    BookingResponse confirm(Long id);

    BookingResponse cancel(Long id);
}
