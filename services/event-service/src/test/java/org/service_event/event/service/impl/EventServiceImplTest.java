package org.service_event.event.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.service_event.event.repository.EventRepository;
import org.service_event.event.repository.model.RepositoryEventModel;
import org.service_event.event.service.model.*;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private ServiceEventMapper serviceEventMapper;

    @InjectMocks
    private EventServiceImpl eventService;

    private static final LocalDateTime FUTURE_START = LocalDateTime.now().plusDays(10);
    private static final LocalDateTime FUTURE_END   = LocalDateTime.now().plusDays(11);

    // ────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────

    private EventCreateDTO validCreateDTO() {
        return EventCreateDTO.builder()
                .title("Festival de Música")
                .availableTickets(100)
                .location("Madrid")
                .startDate(FUTURE_START)
                .endDate(FUTURE_END)
                .organized("Rock Prod")
                .price(45.50)
                .category("Música")
                .contactEmail("info@fest.com")
                .contactPhone("910123456")
                .build();
    }

    private RepositoryEventModel sampleRepo() {
        return RepositoryEventModel.builder()
                .idEvent(1L)
                .title("Festival de Música")
                .availableTickets(100)
                .location("Madrid")
                .startDate(FUTURE_START)
                .endDate(FUTURE_END)
                .organized("Rock Prod")
                .price(45.50)
                .category("Música")
                .contactEmail("info@fest.com")
                .contactPhone("910123456")
                .build();
    }

    private EventResponseDTO sampleResponse() {
        return EventResponseDTO.builder()
                .idEvent(1L)
                .title("Festival de Música")
                .contactEmail("info@fest.com")
                .build();
    }

    // ────────────────────────────────────────────────────────────────
    // createEvent
    // ────────────────────────────────────────────────────────────────

    @Test
    void createEvent_datosValidos_retornaDTO() {
        EventCreateDTO dto = validCreateDTO();
        RepositoryEventModel repo = sampleRepo();
        EventResponseDTO response = sampleResponse();

        when(eventRepository.existsByContactEmail(dto.getContactEmail())).thenReturn(false);
        when(serviceEventMapper.toRepositoryEventModel(dto)).thenReturn(repo);
        when(eventRepository.save(repo)).thenReturn(repo);
        when(serviceEventMapper.toEventResponseDTO(repo)).thenReturn(response);

        EventResponseDTO result = eventService.createEvent(dto);

        assertThat(result).isNotNull();
        assertThat(result.getIdEvent()).isEqualTo(1L);
    }

    @Test
    void createEvent_dtoNulo_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.createEvent(null))
                .isInstanceOf(IllegalArgumentException.class);

        verify(eventRepository, never()).save(any());
    }

    @Test
    void createEvent_emailDuplicado_lanzaIllegalState() {
        EventCreateDTO dto = validCreateDTO();
        when(eventRepository.existsByContactEmail(dto.getContactEmail())).thenReturn(true);

        assertThatThrownBy(() -> eventService.createEvent(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(dto.getContactEmail());

        verify(eventRepository, never()).save(any());
    }

    @Test
    void createEvent_endDateAntesDeStartDate_lanzaIllegalArgument() {
        EventCreateDTO dto = validCreateDTO();
        dto.setEndDate(FUTURE_START.minusDays(1));
        when(eventRepository.existsByContactEmail(dto.getContactEmail())).thenReturn(false);

        assertThatThrownBy(() -> eventService.createEvent(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fecha de fin");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void createEvent_mapperRecibeDTOCorrectamente() {
        EventCreateDTO dto = validCreateDTO();
        RepositoryEventModel repo = sampleRepo();
        EventResponseDTO response = sampleResponse();

        when(eventRepository.existsByContactEmail(anyString())).thenReturn(false);
        ArgumentCaptor<EventCreateDTO> captor = ArgumentCaptor.forClass(EventCreateDTO.class);
        when(serviceEventMapper.toRepositoryEventModel(captor.capture())).thenReturn(repo);
        when(eventRepository.save(repo)).thenReturn(repo);
        when(serviceEventMapper.toEventResponseDTO(repo)).thenReturn(response);

        eventService.createEvent(dto);

        assertThat(captor.getValue().getContactEmail()).isEqualTo("info@fest.com");
    }

    // ────────────────────────────────────────────────────────────────
    // getAllEvents
    // ────────────────────────────────────────────────────────────────

    @Test
    void getAllEvents_retornaColeccion() {
        List<RepositoryEventModel> repos = List.of(sampleRepo());
        List<EventResponseDTO> responses = List.of(sampleResponse());

        when(eventRepository.findAllEvents()).thenReturn(repos);
        when(serviceEventMapper.toEventResponseDTOCollection(repos)).thenReturn(responses);

        Collection<EventResponseDTO> result = eventService.getAllEvents();

        assertThat(result).isNotNull().hasSize(1);
    }

    @Test
    void getAllEvents_sinEventos_retornaColeccionVacia() {
        when(eventRepository.findAllEvents()).thenReturn(List.of());
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of());

        Collection<EventResponseDTO> result = eventService.getAllEvents();

        assertThat(result).isNotNull().isEmpty();
    }

    // ────────────────────────────────────────────────────────────────
    // getEventById
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventById_encontrado_retornaOptionalConDTO() {
        when(eventRepository.findEventById(1L)).thenReturn(Optional.of(sampleRepo()));
        when(serviceEventMapper.toEventResponseDTO(any())).thenReturn(sampleResponse());

        Optional<EventResponseDTO> result = eventService.getEventById(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getIdEvent()).isEqualTo(1L);
    }

    @Test
    void getEventById_noEncontrado_retornaEmpty() {
        when(eventRepository.findEventById(99L)).thenReturn(Optional.empty());

        Optional<EventResponseDTO> result = eventService.getEventById(99L);

        assertThat(result).isEmpty();
    }

    @Test
    void getEventById_idNulo_retornaEmpty() {
        Optional<EventResponseDTO> result = eventService.getEventById(null);

        assertThat(result).isEmpty();
        verify(eventRepository, never()).findEventById(any());
    }

    // ────────────────────────────────────────────────────────────────
    // getEventByContactEmail
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventByContactEmail_encontrado_retornaOptional() {
        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(sampleRepo()));
        when(serviceEventMapper.toEventResponseDTO(any())).thenReturn(sampleResponse());

        Optional<EventResponseDTO> result = eventService.getEventByContactEmail("info@fest.com");

        assertThat(result).isPresent();
    }

    @Test
    void getEventByContactEmail_emailNulo_retornaEmpty() {
        Optional<EventResponseDTO> result = eventService.getEventByContactEmail(null);

        assertThat(result).isEmpty();
        verify(eventRepository, never()).findEventByContactEmail(any());
    }

    @Test
    void getEventByContactEmail_emailVacio_retornaEmpty() {
        Optional<EventResponseDTO> result = eventService.getEventByContactEmail("");

        assertThat(result).isEmpty();
        verify(eventRepository, never()).findEventByContactEmail(any());
    }

    @Test
    void getEventByContactEmail_emailSoloEspacios_retornaEmpty() {
        Optional<EventResponseDTO> result = eventService.getEventByContactEmail("   ");

        assertThat(result).isEmpty();
        verify(eventRepository, never()).findEventByContactEmail(any());
    }

    // ────────────────────────────────────────────────────────────────
    // getEventsByTitle
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventsByTitle_conTitulo_retornaFiltrado() {
        when(eventRepository.findEventsByTitle("Festival")).thenReturn(List.of(sampleRepo()));
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of(sampleResponse()));

        Collection<EventResponseDTO> result = eventService.getEventsByTitle("Festival");

        assertThat(result).hasSize(1);
    }

    @Test
    void getEventsByTitle_tituloNulo_retornaTodos() {
        when(eventRepository.findAllEvents()).thenReturn(List.of(sampleRepo()));
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of(sampleResponse()));

        Collection<EventResponseDTO> result = eventService.getEventsByTitle(null);

        assertThat(result).isNotNull();
        verify(eventRepository, never()).findEventsByTitle(any());
    }

    @Test
    void getEventsByTitle_tituloVacio_retornaTodos() {
        when(eventRepository.findAllEvents()).thenReturn(List.of(sampleRepo()));
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of(sampleResponse()));

        Collection<EventResponseDTO> result = eventService.getEventsByTitle("");

        assertThat(result).isNotNull();
        verify(eventRepository, never()).findEventsByTitle(any());
    }

    @Test
    void getEventsByTitle_tituloSoloEspacios_noLlamaFindByTitle() {
        when(eventRepository.findAllEvents()).thenReturn(List.of());
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of());

        eventService.getEventsByTitle("   ");

        verify(eventRepository, never()).findEventsByTitle(any());
    }

    // ────────────────────────────────────────────────────────────────
    // getEventsByCategory
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventsByCategory_conCategoria_retornaFiltrado() {
        when(eventRepository.findEventsByCategory("Música")).thenReturn(List.of(sampleRepo()));
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of(sampleResponse()));

        Collection<EventResponseDTO> result = eventService.getEventsByCategory("Música");

        assertThat(result).hasSize(1);
    }

    @Test
    void getEventsByCategory_categoriaNula_retornaTodos() {
        when(eventRepository.findAllEvents()).thenReturn(List.of());
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of());

        eventService.getEventsByCategory(null);

        verify(eventRepository, never()).findEventsByCategory(any());
    }

    @Test
    void getEventsByCategory_categoriaSoloEspacios_noLlamaFindByCategory() {
        when(eventRepository.findAllEvents()).thenReturn(List.of());
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of());

        eventService.getEventsByCategory("   ");

        verify(eventRepository, never()).findEventsByCategory(any());
    }

    // ────────────────────────────────────────────────────────────────
    // getEventsByLocation
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventsByLocation_conUbicacion_retornaFiltrado() {
        when(eventRepository.findEventsByLocation("Madrid")).thenReturn(List.of(sampleRepo()));
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of(sampleResponse()));

        Collection<EventResponseDTO> result = eventService.getEventsByLocation("Madrid");

        assertThat(result).hasSize(1);
    }

    @Test
    void getEventsByLocation_ubicacionNula_retornaTodos() {
        when(eventRepository.findAllEvents()).thenReturn(List.of());
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of());

        eventService.getEventsByLocation(null);

        verify(eventRepository, never()).findEventsByLocation(any());
    }

    @Test
    void getEventsByLocation_ubicacionSoloEspacios_noLlamaFindByLocation() {
        when(eventRepository.findAllEvents()).thenReturn(List.of());
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of());

        eventService.getEventsByLocation("   ");

        verify(eventRepository, never()).findEventsByLocation(any());
    }

    // ────────────────────────────────────────────────────────────────
    // getEventsByOrganized
    // ────────────────────────────────────────────────────────────────

    @Test
    void getEventsByOrganized_conOrganizador_retornaFiltrado() {
        when(eventRepository.findEventsByOrganized("Rock Prod")).thenReturn(List.of(sampleRepo()));
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of(sampleResponse()));

        Collection<EventResponseDTO> result = eventService.getEventsByOrganized("Rock Prod");

        assertThat(result).hasSize(1);
    }

    @Test
    void getEventsByOrganized_organizadorNulo_retornaTodos() {
        when(eventRepository.findAllEvents()).thenReturn(List.of());
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of());

        eventService.getEventsByOrganized(null);

        verify(eventRepository, never()).findEventsByOrganized(any());
    }

    @Test
    void getEventsByOrganized_organizadorSoloEspacios_noLlamaFindByOrganized() {
        when(eventRepository.findAllEvents()).thenReturn(List.of());
        when(serviceEventMapper.toEventResponseDTOCollection(anyCollection())).thenReturn(List.of());

        eventService.getEventsByOrganized("   ");

        verify(eventRepository, never()).findEventsByOrganized(any());
    }

    // ────────────────────────────────────────────────────────────────
    // updateEvent
    // ────────────────────────────────────────────────────────────────

    @Test
    void updateEvent_datosValidos_retornaDTO() {
        EventUpdateDTO updateDTO = EventUpdateDTO.builder().title("Nuevo Título").build();
        RepositoryEventModel existing = sampleRepo();
        EventResponseDTO response = sampleResponse();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));
        when(eventRepository.save(existing)).thenReturn(existing);
        when(serviceEventMapper.toEventResponseDTO(existing)).thenReturn(response);

        EventResponseDTO result = eventService.updateEvent("info@fest.com", updateDTO);

        assertThat(result).isNotNull();
        verify(serviceEventMapper).updateRepositoryEventModelFromDTO(eq(updateDTO), eq(existing));
    }

    @Test
    void updateEvent_emailNulo_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.updateEvent(null, EventUpdateDTO.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateEvent_emailVacio_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.updateEvent("", EventUpdateDTO.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateEvent_emailSoloEspacios_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.updateEvent("   ", EventUpdateDTO.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);

        verify(eventRepository, never()).findEventByContactEmail(any());
    }

    @Test
    void updateEvent_dtoNulo_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.updateEvent("info@fest.com", null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateEvent_eventoNoEncontrado_lanzaIllegalState() {
        when(eventRepository.findEventByContactEmail("noexi@st.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.updateEvent("noexi@st.com", EventUpdateDTO.builder().build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("noexi@st.com");
    }

    @Test
    void updateEvent_nuevoEmailDuplicado_lanzaIllegalState() {
        RepositoryEventModel existing = sampleRepo();
        EventUpdateDTO updateDTO = EventUpdateDTO.builder().contactEmail("otro@email.com").build();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));
        when(eventRepository.existsByContactEmail("otro@email.com")).thenReturn(true);

        assertThatThrownBy(() -> eventService.updateEvent("info@fest.com", updateDTO))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("otro@email.com");
    }

    @Test
    void updateEvent_endDateAntesDeStartDate_lanzaIllegalArgument() {
        RepositoryEventModel existing = sampleRepo();
        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .startDate(FUTURE_START)
                .endDate(FUTURE_START.minusDays(1))
                .build();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> eventService.updateEvent("info@fest.com", updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fecha de fin");
    }

    @Test
    void updateEvent_soloStartDateActualizadaConflictoEndDateExistente_lanzaIllegalArgument() {
        // Rama else-if línea 186: solo se actualiza startDate, endDate viene del evento existente
        RepositoryEventModel existing = sampleRepo();
        existing.setEndDate(FUTURE_START.plusDays(1));   // endDate existente: start+1

        // nueva startDate posterior al endDate existente → conflicto
        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .startDate(FUTURE_START.plusDays(5))     // startDate > endDate existente
                .build();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> eventService.updateEvent("info@fest.com", updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fecha de inicio");
    }

    @Test
    void updateEvent_soloStartDateActualizadaCompatibleConEndDateExistente_noLanzaExcepcion() {
        // Rama else-if línea 186: startDate válida (anterior al endDate existente)
        RepositoryEventModel existing = sampleRepo();
        EventResponseDTO response = sampleResponse();

        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .startDate(FUTURE_START)   // startDate < endDate existente (FUTURE_END)
                .build();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));
        when(eventRepository.save(existing)).thenReturn(existing);
        when(serviceEventMapper.toEventResponseDTO(existing)).thenReturn(response);

        assertThatCode(() -> eventService.updateEvent("info@fest.com", updateDTO))
                .doesNotThrowAnyException();
    }

    @Test
    void updateEvent_soloEndDateActualizadaConflictoStartDateExistente_lanzaIllegalArgument() {
        // Rama else-if línea 192: solo se actualiza endDate, startDate viene del evento existente
        RepositoryEventModel existing = sampleRepo();
        existing.setStartDate(FUTURE_START);

        // nueva endDate anterior al startDate existente → conflicto
        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .endDate(FUTURE_START.minusDays(1))
                .build();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> eventService.updateEvent("info@fest.com", updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fecha de fin");
    }

    @Test
    void updateEvent_soloEndDateActualizadaCompatibleConStartDateExistente_noLanzaExcepcion() {
        // Rama else-if línea 192: endDate válida (posterior al startDate existente)
        RepositoryEventModel existing = sampleRepo();
        EventResponseDTO response = sampleResponse();

        EventUpdateDTO updateDTO = EventUpdateDTO.builder()
                .endDate(FUTURE_END)
                .build();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));
        when(eventRepository.save(existing)).thenReturn(existing);
        when(serviceEventMapper.toEventResponseDTO(existing)).thenReturn(response);

        assertThatCode(() -> eventService.updateEvent("info@fest.com", updateDTO))
                .doesNotThrowAnyException();
    }

    @Test
    void updateEvent_ticketsCeroEnUpdate_noLanzaExcepcion() {
        // Límite inferior válido: 0 NO debe lanzar excepción (mata mutante < 0 → <= 0)
        RepositoryEventModel existing = sampleRepo();
        EventResponseDTO response = sampleResponse();
        EventUpdateDTO updateDTO = EventUpdateDTO.builder().availableTickets(0).build();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));
        when(eventRepository.save(existing)).thenReturn(existing);
        when(serviceEventMapper.toEventResponseDTO(existing)).thenReturn(response);

        assertThatCode(() -> eventService.updateEvent("info@fest.com", updateDTO))
                .doesNotThrowAnyException();
    }

    @Test
    void updateEvent_ticketsNegativosEnUpdate_lanzaIllegalArgument() {
        RepositoryEventModel existing = sampleRepo();
        EventUpdateDTO updateDTO = EventUpdateDTO.builder().availableTickets(-1).build();

        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> eventService.updateEvent("info@fest.com", updateDTO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ────────────────────────────────────────────────────────────────
    // deleteEvent
    // ────────────────────────────────────────────────────────────────

    @Test
    void deleteEvent_emailValido_eliminaEvento() {
        RepositoryEventModel existing = sampleRepo();
        when(eventRepository.findEventByContactEmail("info@fest.com")).thenReturn(Optional.of(existing));

        eventService.deleteEvent("info@fest.com");

        verify(eventRepository).delete(existing);
    }

    @Test
    void deleteEvent_emailNulo_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.deleteEvent(null))
                .isInstanceOf(IllegalArgumentException.class);

        verify(eventRepository, never()).delete(any());
    }

    @Test
    void deleteEvent_emailVacio_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.deleteEvent(""))
                .isInstanceOf(IllegalArgumentException.class);

        verify(eventRepository, never()).delete(any());
    }

    @Test
    void deleteEvent_emailSoloEspacios_noLlamaRepo() {
        assertThatThrownBy(() -> eventService.deleteEvent("   "))
                .isInstanceOf(IllegalArgumentException.class);

        verify(eventRepository, never()).findEventByContactEmail(any());
    }

    @Test
    void deleteEvent_eventoNoEncontrado_lanzaIllegalState() {
        when(eventRepository.findEventByContactEmail("noexi@st.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.deleteEvent("noexi@st.com"))
                .isInstanceOf(IllegalStateException.class);

        verify(eventRepository, never()).delete(any());
    }

    // ────────────────────────────────────────────────────────────────
    // existsByContactEmail
    // ────────────────────────────────────────────────────────────────

    @Test
    void existsByContactEmail_existe_retornaTrue() {
        when(eventRepository.existsByContactEmail("info@fest.com")).thenReturn(true);

        assertThat(eventService.existsByContactEmail("info@fest.com")).isTrue();
    }

    @Test
    void existsByContactEmail_noExiste_retornaFalse() {
        when(eventRepository.existsByContactEmail(anyString())).thenReturn(false);

        assertThat(eventService.existsByContactEmail("noexi@st.com")).isFalse();
    }

    @Test
    void existsByContactEmail_emailNulo_retornaFalse() {
        assertThat(eventService.existsByContactEmail(null)).isFalse();
        verify(eventRepository, never()).existsByContactEmail(any());
    }

    @Test
    void existsByContactEmail_emailVacio_retornaFalse() {
        assertThat(eventService.existsByContactEmail("")).isFalse();
        verify(eventRepository, never()).existsByContactEmail(any());
    }

    @Test
    void existsByContactEmail_emailSoloEspacios_noLlamaRepo() {
        boolean result = eventService.existsByContactEmail("   ");

        assertThat(result).isFalse();
        verify(eventRepository, never()).existsByContactEmail(any());
    }

    // ────────────────────────────────────────────────────────────────
    // decrementStock
    // ────────────────────────────────────────────────────────────────

    @Test
    void decrementStock_valido_decrementaYGuarda() {
        RepositoryEventModel event = sampleRepo();
        event.setAvailableTickets(10);
        when(eventRepository.findEventById(1L)).thenReturn(Optional.of(event));
        when(eventRepository.save(any())).thenReturn(event);

        eventService.decrementStock(1L, 3);

        assertThat(event.getAvailableTickets()).isEqualTo(7);
        verify(eventRepository).save(event);
    }

    @Test
    void decrementStock_idNulo_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.decrementStock(null, 5))
                .isInstanceOf(IllegalArgumentException.class);

        verify(eventRepository, never()).findEventById(any());
    }

    @Test
    void decrementStock_cantidadNula_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.decrementStock(1L, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void decrementStock_cantidadCero_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.decrementStock(1L, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void decrementStock_cantidadNegativa_lanzaIllegalArgument() {
        assertThatThrownBy(() -> eventService.decrementStock(1L, -1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void decrementStock_eventoNoEncontrado_lanzaRuntimeException() {
        when(eventRepository.findEventById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.decrementStock(99L, 5))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Evento no encontrado con ID: 99");
    }

    @Test
    void decrementStock_stockInsuficiente_lanzaRuntimeException() {
        RepositoryEventModel event = sampleRepo();
        event.setAvailableTickets(2);
        when(eventRepository.findEventById(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.decrementStock(1L, 5))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Stock insuficiente");
    }

    @Test
    void decrementStock_stockNulo_lanzaRuntimeExceptionConMensaje() {
        RepositoryEventModel event = sampleRepo();
        event.setAvailableTickets(null);
        when(eventRepository.findEventById(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.decrementStock(1L, 5))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no tiene stock");
    }

    @Test
    void decrementStock_exactamenteTodoElStock_dejaEnCero() {
        RepositoryEventModel event = sampleRepo();
        event.setAvailableTickets(5);
        when(eventRepository.findEventById(1L)).thenReturn(Optional.of(event));
        when(eventRepository.save(any())).thenReturn(event);

        eventService.decrementStock(1L, 5);

        assertThat(event.getAvailableTickets()).isEqualTo(0);
    }
}
