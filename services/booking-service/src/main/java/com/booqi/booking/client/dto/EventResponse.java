package com.booqi.booking.client.dto;

import java.time.LocalDateTime;

public record EventResponse(Long id, String title, String description, LocalDateTime startDate, String location,
                            Double price) {
}
