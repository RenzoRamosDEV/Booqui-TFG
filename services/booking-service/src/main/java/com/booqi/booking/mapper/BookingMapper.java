package com.booqi.booking.mapper;

import com.booqi.booking.dto.response.BookingResponse;
import com.booqi.booking.entity.Booking;

import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    BookingResponse toResponse(Booking booking);

    List<BookingResponse> toResponseList(List<Booking> bookings);
}
