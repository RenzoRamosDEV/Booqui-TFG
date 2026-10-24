package com.booqi.event.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.booqi.event.dto.request.CreateEventRequest;
import com.booqi.event.dto.request.UpdateEventRequest;
import com.booqi.event.dto.response.EventResponse;
import com.booqi.event.entity.Event;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;

class EventMapperTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 6, 15, 20, 0);
    private static final LocalDateTime END = LocalDateTime.of(2026, 6, 15, 23, 0);
    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 1, 1, 10, 0);
    private static final LocalDateTime UPDATED = LocalDateTime.of(2026, 1, 2, 11, 30);

    private final EventMapper mapper = new EventMapperImpl();

    private Event entity() {
        return Event.builder()
                .id(7L)
                .title("Festival de Jazz")
                .description("Noche de jazz")
                .availableTickets(150)
                .location("Madrid")
                .startDate(START)
                .endDate(END)
                .organizer("Jazz Madrid")
                .price(25.0)
                .category("Música")
                .contactEmail("jazz@booqi.com")
                .contactPhone("910000007")
                .imageUrl("https://img.booqi.com/jazz.jpg")
                .createdAt(CREATED)
                .updatedAt(UPDATED)
                .build();
    }

    private static UpdateEventRequest emptyUpdate() {
        return new UpdateEventRequest(
                null, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void toResponse_copiaTodosLosCampos() {
        EventResponse response = mapper.toResponse(entity());

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.title()).isEqualTo("Festival de Jazz");
        assertThat(response.description()).isEqualTo("Noche de jazz");
        assertThat(response.availableTickets()).isEqualTo(150);
        assertThat(response.location()).isEqualTo("Madrid");
        assertThat(response.startDate()).isEqualTo(START);
        assertThat(response.endDate()).isEqualTo(END);
        assertThat(response.organizer()).isEqualTo("Jazz Madrid");
        assertThat(response.price()).isEqualTo(25.0);
        assertThat(response.category()).isEqualTo("Música");
        assertThat(response.contactEmail()).isEqualTo("jazz@booqi.com");
        assertThat(response.contactPhone()).isEqualTo("910000007");
        assertThat(response.imageUrl()).isEqualTo("https://img.booqi.com/jazz.jpg");
        assertThat(response.createdAt()).isEqualTo(CREATED);
        assertThat(response.updatedAt()).isEqualTo(UPDATED);
    }

    @Test
    void eventResponse_tieneExactamenteLosCamposDelContrato() {
        assertThat(EventResponse.class.getDeclaredFields())
                .extracting(Field::getName)
                .containsExactlyInAnyOrder(
                        "id",
                        "title",
                        "description",
                        "availableTickets",
                        "location",
                        "startDate",
                        "endDate",
                        "organizer",
                        "price",
                        "category",
                        "contactEmail",
                        "contactPhone",
                        "imageUrl",
                        "createdAt",
                        "updatedAt");
    }

    @Test
    void toEntity_ignoraIdYAuditoria() {
        CreateEventRequest request =
                new CreateEventRequest(
                        "Nuevo",
                        "Desc",
                        10,
                        "Sevilla",
                        START,
                        END,
                        "Org",
                        5.0,
                        "Teatro",
                        "new@booqi.com",
                        "600000000",
                        "https://img.booqi.com/new.jpg");

        Event event = mapper.toEntity(request);

        assertThat(event.getTitle()).isEqualTo("Nuevo");
        assertThat(event.getDescription()).isEqualTo("Desc");
        assertThat(event.getAvailableTickets()).isEqualTo(10);
        assertThat(event.getLocation()).isEqualTo("Sevilla");
        assertThat(event.getStartDate()).isEqualTo(START);
        assertThat(event.getEndDate()).isEqualTo(END);
        assertThat(event.getOrganizer()).isEqualTo("Org");
        assertThat(event.getPrice()).isEqualTo(5.0);
        assertThat(event.getCategory()).isEqualTo("Teatro");
        assertThat(event.getContactEmail()).isEqualTo("new@booqi.com");
        assertThat(event.getContactPhone()).isEqualTo("600000000");
        assertThat(event.getImageUrl()).isEqualTo("https://img.booqi.com/new.jpg");
        assertThat(event.getId()).isNull();
        assertThat(event.getCreatedAt()).isNull();
        assertThat(event.getUpdatedAt()).isNull();
    }

    @Test
    void updateEntity_conCamposNulosNoModificaElDestino() {
        Event target = entity();

        mapper.updateEntity(emptyUpdate(), target);

        assertThat(target.getTitle()).isEqualTo("Festival de Jazz");
        assertThat(target.getOrganizer()).isEqualTo("Jazz Madrid");
        assertThat(target.getImageUrl()).isEqualTo("https://img.booqi.com/jazz.jpg");
        assertThat(target.getAvailableTickets()).isEqualTo(150);
        assertThat(target.getPrice()).isEqualTo(25.0);
    }

    @Test
    void updateEntity_aplicaCamposPresentesSinTocarIdNiAuditoria() {
        Event target = entity();
        UpdateEventRequest request =
                new UpdateEventRequest(
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        "Nuevo Organizador",
                        null,
                        null,
                        null,
                        null,
                        "https://img.booqi.com/b.jpg");

        mapper.updateEntity(request, target);

        assertThat(target.getOrganizer()).isEqualTo("Nuevo Organizador");
        assertThat(target.getImageUrl()).isEqualTo("https://img.booqi.com/b.jpg");
        assertThat(target.getTitle()).isEqualTo("Festival de Jazz");
        assertThat(target.getId()).isEqualTo(7L);
        assertThat(target.getCreatedAt()).isEqualTo(CREATED);
        assertThat(target.getUpdatedAt()).isEqualTo(UPDATED);
    }

    @Test
    void toResponseList_mapeaCadaElemento() {
        List<EventResponse> responses = mapper.toResponseList(List.of(entity(), entity()));

        assertThat(responses).hasSize(2).extracting(EventResponse::id).containsExactly(7L, 7L);
    }

    @Test
    void toResponseList_listaVacia() {
        assertThat(mapper.toResponseList(List.of())).isEmpty();
    }
}
