package com.booqi.booking.mapper;

import com.booqi.booking.dto.response.BookingResponse;
import com.booqi.booking.entity.Booking;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BookingMapperTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 6, 15, 20, 0);
    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 1, 1, 10, 0);
    private static final LocalDateTime UPDATED = LocalDateTime.of(2026, 1, 2, 11, 30);

    private final BookingMapper mapper = new BookingMapperImpl();

    private Booking entity() {
        return Booking.builder()
                .id(7L)
                .userId(3L)
                .userFirstName("Ana")
                .userLastName("Lopez")
                .userEmail("ana@booqi.com")
                .eventId(2L)
                .eventTitle("Clases de Baile")
                .eventDescription("Salsa y bachata")
                .eventStartDate(START)
                .eventLocation("Alcorcon")
                .ticketQuantity(2)
                .basePrice(new BigDecimal("35.00"))
                .totalPrice(new BigDecimal("70.00"))
                .status("PENDING")
                .createdAt(CREATED)
                .updatedAt(UPDATED)
                .build();
    }

    @Test
    void toResponse_copiaTodosLosCampos() {
        BookingResponse response = mapper.toResponse(entity());

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.userId()).isEqualTo(3L);
        assertThat(response.userFirstName()).isEqualTo("Ana");
        assertThat(response.userLastName()).isEqualTo("Lopez");
        assertThat(response.userEmail()).isEqualTo("ana@booqi.com");
        assertThat(response.eventId()).isEqualTo(2L);
        assertThat(response.eventTitle()).isEqualTo("Clases de Baile");
        assertThat(response.eventDescription()).isEqualTo("Salsa y bachata");
        assertThat(response.eventStartDate()).isEqualTo(START);
        assertThat(response.eventLocation()).isEqualTo("Alcorcon");
        assertThat(response.ticketQuantity()).isEqualTo(2);
        assertThat(response.basePrice()).isEqualByComparingTo("35.00");
        assertThat(response.totalPrice()).isEqualByComparingTo("70.00");
        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.createdAt()).isEqualTo(CREATED);
        assertThat(response.updatedAt()).isEqualTo(UPDATED);
    }

    @Test
    void bookingResponse_tieneExactamenteLosCamposDelContrato() {
        assertThat(BookingResponse.class.getDeclaredFields())
                .extracting(Field::getName)
                .containsExactlyInAnyOrder("id", "userId", "userFirstName", "userLastName", "userEmail",
                        "eventId", "eventTitle", "eventDescription", "eventStartDate", "eventLocation",
                        "ticketQuantity", "basePrice", "totalPrice", "status", "createdAt", "updatedAt");
    }

    @Test
    void toResponseList_mapeaCadaElemento() {
        List<BookingResponse> responses = mapper.toResponseList(List.of(entity(), entity()));

        assertThat(responses).hasSize(2).extracting(BookingResponse::id).containsExactly(7L, 7L);
    }

    @Test
    void toResponseList_listaVacia() {
        assertThat(mapper.toResponseList(List.of())).isEmpty();
    }
}
