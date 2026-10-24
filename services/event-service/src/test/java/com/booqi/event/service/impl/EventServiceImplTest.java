package com.booqi.event.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

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
import com.booqi.event.mapper.EventMapperImpl;
import com.booqi.event.repository.EventRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    private static final LocalDateTime START = LocalDateTime.of(2030, 6, 15, 20, 0);
    private static final LocalDateTime END = LocalDateTime.of(2030, 6, 15, 23, 0);

    @Mock private EventRepository eventRepository;

    @Spy private EventMapper eventMapper = new EventMapperImpl();

    @InjectMocks private EventServiceImpl eventService;

    private Event festival;

    @BeforeEach
    void setUp() {
        festival =
                Event.builder()
                        .id(1L)
                        .title("Festival de Food Trucks")
                        .availableTickets(15)
                        .location("Madrid")
                        .startDate(START)
                        .endDate(END)
                        .organizer("Asociación Foodies Madrid")
                        .price(45.0)
                        .category("Gastronomía")
                        .contactEmail("contacto@foodtruckfest.com")
                        .contactPhone("910000001")
                        .build();
    }

    private static CreateEventRequest createRequest(
            LocalDateTime startDate, LocalDateTime endDate) {
        return new CreateEventRequest(
                "Festival de Jazz",
                null,
                100,
                "Madrid",
                startDate,
                endDate,
                "Jazz Madrid",
                20.0,
                "Música",
                "new@event.com",
                "910123456",
                null);
    }

    private static UpdateEventRequest updateDates(LocalDateTime startDate, LocalDateTime endDate) {
        return new UpdateEventRequest(
                null, null, null, null, startDate, endDate, null, null, null, null, null, null);
    }

    private static UpdateEventRequest updateEmail(String contactEmail) {
        return new UpdateEventRequest(
                null, null, null, null, null, null, null, null, null, contactEmail, null, null);
    }

    private static UpdateEventRequest updateTickets(Integer availableTickets) {
        return new UpdateEventRequest(
                null, null, availableTickets, null, null, null, null, null, null, null, null, null);
    }

    private static EventFilter filter(
            String contactEmail, String title, String category, String location, String organizer) {
        return new EventFilter(contactEmail, title, category, location, organizer);
    }

    private void givenFestivalIsSaved() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));
        when(eventRepository.save(festival)).thenReturn(festival);
    }

    // create

    @Test
    void create_cuandoDatosValidos_guardaYRetornaEvento() {
        when(eventRepository.existsByContactEmail("new@event.com")).thenReturn(false);
        when(eventRepository.save(any(Event.class)))
                .thenAnswer(
                        inv -> {
                            Event e = inv.getArgument(0);
                            e.setId(5L);
                            return e;
                        });

        EventResponse resultado = eventService.create(createRequest(START, END));

        assertThat(resultado.id()).isEqualTo(5L);
        assertThat(resultado.organizer()).isEqualTo("Jazz Madrid");
        assertThat(resultado.contactEmail()).isEqualTo("new@event.com");
    }

    @Test
    void create_cuandoEmailDuplicado_lanzaConflictYNoGuarda() {
        when(eventRepository.existsByContactEmail("new@event.com")).thenReturn(true);

        assertThatThrownBy(() -> eventService.create(createRequest(START, END)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Event with contactEmail new@event.com already exists");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_cuandoFinAntesQueInicio_lanzaBusinessYNoGuarda() {
        when(eventRepository.existsByContactEmail("new@event.com")).thenReturn(false);

        assertThatThrownBy(() -> eventService.create(createRequest(START, START.minusMinutes(1))))
                .isInstanceOf(BusinessException.class)
                .hasMessage("End date cannot be before start date");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_cuandoFinIgualAInicio_guarda() {
        when(eventRepository.existsByContactEmail("new@event.com")).thenReturn(false);
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        EventResponse resultado = eventService.create(createRequest(START, START));

        assertThat(resultado.endDate()).isEqualTo(START);
    }

    // findAll / findById / existsById

    @Test
    void findAll_retornaTodosMapeados() {
        when(eventRepository.findAll()).thenReturn(List.of(festival));

        assertThat(eventService.findAll()).extracting(EventResponse::id).containsExactly(1L);
    }

    @Test
    void findById_cuandoExiste_retornaEvento() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));

        assertThat(eventService.findById(1L).title()).isEqualTo("Festival de Food Trucks");
    }

    @Test
    void findById_cuandoNoExiste_lanzaResourceNotFound() {
        when(eventRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event with id 99 not found");
    }

    @Test
    void existsById_reflejaElRepositorio() {
        when(eventRepository.existsById(1L)).thenReturn(true);
        when(eventRepository.existsById(2L)).thenReturn(false);

        assertThat(eventService.existsById(1L)).isTrue();
        assertThat(eventService.existsById(2L)).isFalse();
    }

    // findBy*

    @Test
    void findByContactEmail_cuandoExiste_retornaListaConElEvento() {
        when(eventRepository.findByContactEmail("contacto@foodtruckfest.com"))
                .thenReturn(Optional.of(festival));

        assertThat(eventService.findByContactEmail("contacto@foodtruckfest.com"))
                .extracting(EventResponse::id)
                .containsExactly(1L);
    }

    @Test
    void findByContactEmail_cuandoNoExiste_retornaListaVacia() {
        when(eventRepository.findByContactEmail("nobody@nowhere.com")).thenReturn(Optional.empty());

        assertThat(eventService.findByContactEmail("nobody@nowhere.com")).isEmpty();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void findByContactEmail_cuandoEnBlanco_retornaVacioSinConsultar(String blank) {
        assertThat(eventService.findByContactEmail(blank)).isEmpty();
        verifyNoInteractions(eventRepository);
    }

    @Test
    void findByTitle_retornaLista() {
        when(eventRepository.findByTitleContainingIgnoreCase("food")).thenReturn(List.of(festival));

        assertThat(eventService.findByTitle("food"))
                .extracting(EventResponse::id)
                .containsExactly(1L);
    }

    @Test
    void findByCategory_retornaLista() {
        when(eventRepository.findByCategoryIgnoreCase("gastronomía")).thenReturn(List.of(festival));

        assertThat(eventService.findByCategory("gastronomía"))
                .extracting(EventResponse::id)
                .containsExactly(1L);
    }

    @Test
    void findByLocation_retornaLista() {
        when(eventRepository.findByLocationContainingIgnoreCase("madrid"))
                .thenReturn(List.of(festival));

        assertThat(eventService.findByLocation("madrid"))
                .extracting(EventResponse::id)
                .containsExactly(1L);
    }

    @Test
    void findByOrganizer_retornaLista() {
        when(eventRepository.findByOrganizerContainingIgnoreCase("foodies"))
                .thenReturn(List.of(festival));

        assertThat(eventService.findByOrganizer("foodies"))
                .extracting(EventResponse::id)
                .containsExactly(1L);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void findByTexto_cuandoEnBlanco_retornaTodos(String blank) {
        when(eventRepository.findAll()).thenReturn(List.of(festival));

        assertThat(eventService.findByTitle(blank)).hasSize(1);
        assertThat(eventService.findByCategory(blank)).hasSize(1);
        assertThat(eventService.findByLocation(blank)).hasSize(1);
        assertThat(eventService.findByOrganizer(blank)).hasSize(1);
        verify(eventRepository, never()).findByTitleContainingIgnoreCase(any());
        verify(eventRepository, never()).findByCategoryIgnoreCase(any());
        verify(eventRepository, never()).findByLocationContainingIgnoreCase(any());
        verify(eventRepository, never()).findByOrganizerContainingIgnoreCase(any());
    }

    // findAll(EventFilter)

    @Test
    void findAllFiltro_sinFiltros_retornaTodos() {
        when(eventRepository.findAll()).thenReturn(List.of(festival));

        assertThat(eventService.findAll(filter(null, null, null, null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_soloFiltrosEnBlanco_retornaTodos() {
        when(eventRepository.findAll()).thenReturn(List.of(festival));

        assertThat(eventService.findAll(filter("", " ", "  ", "", " "))).hasSize(1);
    }

    @Test
    void findAllFiltro_porContactEmail() {
        when(eventRepository.findByContactEmail("contacto@foodtruckfest.com"))
                .thenReturn(Optional.of(festival));

        assertThat(
                        eventService.findAll(
                                filter("contacto@foodtruckfest.com", null, null, null, null)))
                .hasSize(1);
    }

    @Test
    void findAllFiltro_porTitle() {
        when(eventRepository.findByTitleContainingIgnoreCase("jazz")).thenReturn(List.of(festival));

        assertThat(eventService.findAll(filter(null, "jazz", null, null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_porCategory() {
        when(eventRepository.findByCategoryIgnoreCase("Música")).thenReturn(List.of(festival));

        assertThat(eventService.findAll(filter(null, null, "Música", null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_porLocation() {
        when(eventRepository.findByLocationContainingIgnoreCase("Madrid"))
                .thenReturn(List.of(festival));

        assertThat(eventService.findAll(filter(null, null, null, "Madrid", null))).hasSize(1);
    }

    @Test
    void findAllFiltro_porOrganizer() {
        when(eventRepository.findByOrganizerContainingIgnoreCase("foodies"))
                .thenReturn(List.of(festival));

        assertThat(eventService.findAll(filter(null, null, null, null, "foodies"))).hasSize(1);
    }

    @Test
    void findAllFiltro_filtroEnBlancoSeIgnora() {
        when(eventRepository.findByCategoryIgnoreCase("Música")).thenReturn(List.of(festival));

        assertThat(eventService.findAll(filter(null, "", "Música", null, null))).hasSize(1);
    }

    static Stream<Arguments> paresDeFiltros() {
        String[] values = {"contacto@foodtruckfest.com", "jazz", "Música", "Madrid", "foodies"};
        Stream.Builder<Arguments> pairs = Stream.builder();
        for (int i = 0; i < values.length; i++) {
            for (int j = i + 1; j < values.length; j++) {
                String[] components = new String[values.length];
                components[i] = values[i];
                components[j] = values[j];
                pairs.add(
                        Arguments.of(
                                filter(
                                        components[0],
                                        components[1],
                                        components[2],
                                        components[3],
                                        components[4])));
            }
        }
        return pairs.build();
    }

    @ParameterizedTest
    @MethodSource("paresDeFiltros")
    void findAllFiltro_dosFiltros_lanzaInvalidFilterSinConsultar(EventFilter filtro) {
        assertThatThrownBy(() -> eventService.findAll(filtro))
                .isInstanceOf(InvalidFilterException.class)
                .hasMessage("Only one filter may be used at a time");
        verifyNoInteractions(eventRepository);
    }

    // update

    @Test
    void update_cuandoNoExiste_lanzaResourceNotFound() {
        when(eventRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.update(99L, updateTickets(5)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event with id 99 not found");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void update_cuandoNuevoEmailDuplicado_lanzaConflictYNoGuarda() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));
        when(eventRepository.existsByContactEmail("baile@alcorcon.es")).thenReturn(true);

        assertThatThrownBy(() -> eventService.update(1L, updateEmail("baile@alcorcon.es")))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Event with contactEmail baile@alcorcon.es already exists");
        verify(eventRepository, never()).save(any());
        assertThat(festival.getContactEmail()).isEqualTo("contacto@foodtruckfest.com");
    }

    @Test
    void update_cuandoMismoEmail_noCompruebaDuplicado() {
        givenFestivalIsSaved();

        eventService.update(1L, updateEmail("contacto@foodtruckfest.com"));

        verify(eventRepository, never()).existsByContactEmail(any());
    }

    @Test
    void update_cuandoNuevoEmailLibre_loAplica() {
        givenFestivalIsSaved();
        when(eventRepository.existsByContactEmail("nuevo@event.com")).thenReturn(false);

        assertThat(eventService.update(1L, updateEmail("nuevo@event.com")).contactEmail())
                .isEqualTo("nuevo@event.com");
    }

    @Test
    void update_parcialSoloCambiaLosCamposPresentes() {
        givenFestivalIsSaved();

        EventResponse resultado =
                eventService.update(
                        1L,
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
                                null));

        assertThat(resultado.organizer()).isEqualTo("Nuevo Organizador");
        assertThat(resultado.title()).isEqualTo("Festival de Food Trucks");
        assertThat(resultado.availableTickets()).isEqualTo(15);
    }

    @Test
    void update_cuandoAmbasFechasYFinAntesQueInicio_lanzaBusinessYNoGuarda() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));

        assertThatThrownBy(() -> eventService.update(1L, updateDates(START, START.minusMinutes(1))))
                .isInstanceOf(BusinessException.class)
                .hasMessage("End date cannot be before start date");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void update_cuandoAmbasFechasIguales_guarda() {
        givenFestivalIsSaved();

        assertThat(eventService.update(1L, updateDates(START, START)).endDate()).isEqualTo(START);
    }

    @Test
    void update_cuandoSoloInicioPosteriorAlFinExistente_lanzaBusiness() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));

        assertThatThrownBy(() -> eventService.update(1L, updateDates(END.plusMinutes(1), null)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("New start date cannot be after the existing end date");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void update_cuandoSoloInicioIgualAlFinExistente_guarda() {
        givenFestivalIsSaved();

        assertThat(eventService.update(1L, updateDates(END, null)).startDate()).isEqualTo(END);
    }

    @Test
    void update_cuandoSoloFinAnteriorAlInicioExistente_lanzaBusiness() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));

        assertThatThrownBy(() -> eventService.update(1L, updateDates(null, START.minusMinutes(1))))
                .isInstanceOf(BusinessException.class)
                .hasMessage("New end date cannot be before the existing start date");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void update_cuandoSoloFinIgualAlInicioExistente_guarda() {
        givenFestivalIsSaved();

        assertThat(eventService.update(1L, updateDates(null, START)).endDate()).isEqualTo(START);
    }

    @Test
    void update_cuandoTicketsNegativos_lanzaBusinessYNoGuarda() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));

        assertThatThrownBy(() -> eventService.update(1L, updateTickets(-1)))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Available tickets cannot be negative");
        verify(eventRepository, never()).save(any());
        assertThat(festival.getAvailableTickets()).isEqualTo(15);
    }

    @Test
    void update_cuandoTicketsCero_loAplica() {
        givenFestivalIsSaved();

        assertThat(eventService.update(1L, updateTickets(0)).availableTickets()).isZero();
    }

    // delete

    @Test
    void delete_cuandoExiste_eliminaPorId() {
        when(eventRepository.existsById(1L)).thenReturn(true);

        eventService.delete(1L);

        verify(eventRepository).deleteById(1L);
    }

    @Test
    void delete_cuandoNoExiste_lanzaResourceNotFoundSinBorrar() {
        when(eventRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> eventService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event with id 99 not found");
        verify(eventRepository, never()).deleteById(any());
    }

    // decrementStock

    @Test
    void decrementStock_cuandoHayStock_restaGuardaYRetornaEvento() {
        givenFestivalIsSaved();

        EventResponse resultado = eventService.decrementStock(1L, 2);

        assertThat(resultado.availableTickets()).isEqualTo(13);
        assertThat(festival.getAvailableTickets()).isEqualTo(13);
        verify(eventRepository).save(festival);
    }

    @Test
    void decrementStock_cuandoCantidadIgualAlStock_dejaCero() {
        givenFestivalIsSaved();

        assertThat(eventService.decrementStock(1L, 15).availableTickets()).isZero();
    }

    @Test
    void decrementStock_cuandoStockInsuficiente_lanzaBusinessSinGuardar() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));

        assertThatThrownBy(() -> eventService.decrementStock(1L, 16))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Insufficient stock for event 1: available 15, requested 16");
        verify(eventRepository, never()).save(any());
        assertThat(festival.getAvailableTickets()).isEqualTo(15);
    }

    @Test
    void decrementStock_cuandoStockNulo_lanzaBusiness() {
        festival.setAvailableTickets(null);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(festival));

        assertThatThrownBy(() -> eventService.decrementStock(1L, 1))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Event 1 has no stock configured");
        verify(eventRepository, never()).save(any());
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(ints = {0, -1})
    void decrementStock_cuandoCantidadNoPositiva_lanzaBusinessSinConsultar(Integer quantity) {
        assertThatThrownBy(() -> eventService.decrementStock(1L, quantity))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Quantity must be greater than zero");
        verifyNoInteractions(eventRepository);
    }

    @Test
    void decrementStock_cuandoNoExiste_lanzaResourceNotFound() {
        when(eventRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.decrementStock(99L, 1))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event with id 99 not found");
    }
}
