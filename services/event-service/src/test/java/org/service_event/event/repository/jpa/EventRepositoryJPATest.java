package org.service_event.event.repository.jpa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.service_event.event.EventApplication;
import org.service_event.event.repository.EventRepository;
import org.service_event.event.repository.model.RepositoryEventModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(classes = EventApplication.class)
@Transactional
class EventRepositoryJPATest {

    @Autowired
    private EventRepositoryJPA eventRepositoryJPA;

    private EventRepository eventRepository;

    private static final LocalDateTime FUTURE_START = LocalDateTime.now().plusDays(10);
    private static final LocalDateTime FUTURE_END   = LocalDateTime.now().plusDays(11);

    @BeforeEach
    void setUp() {
        eventRepository = eventRepositoryJPA;
        eventRepositoryJPA.deleteAll();
    }

    // ────────────────────────────────────────────────────────────────
    // Helper
    // ────────────────────────────────────────────────────────────────

    private RepositoryEventModel buildEvent(String email) {
        return RepositoryEventModel.builder()
                .title("Festival de Música")
                .availableTickets(100)
                .location("Madrid")
                .startDate(FUTURE_START)
                .endDate(FUTURE_END)
                .organized("Rock Prod")
                .price(45.50)
                .category("Música")
                .contactEmail(email)
                .contactPhone("910123456")
                .build();
    }

    // ────────────────────────────────────────────────────────────────
    // save
    // ────────────────────────────────────────────────────────────────

    @Test
    void save_eventoValido_persisteYRetornaConId() {
        RepositoryEventModel saved = eventRepository.save(buildEvent("fest@test.com"));

        assertThat(saved).isNotNull();
        assertThat(saved.getIdEvent()).isNotNull().isPositive();
        assertThat(saved.getContactEmail()).isEqualTo("fest@test.com");
    }

    @Test
    void save_eventoNulo_lanzaExcepcion() {
        // Spring envuelve IllegalArgumentException en InvalidDataAccessApiUsageException
        assertThatThrownBy(() -> eventRepository.save(null))
                .satisfies(ex -> assertThat(
                        ex instanceof IllegalArgumentException ||
                        ex.getCause() instanceof IllegalArgumentException ||
                        ex.getClass().getSimpleName().contains("InvalidDataAccess")
                ).isTrue());
    }

    // ────────────────────────────────────────────────────────────────
    // findAllEvents
    // ────────────────────────────────────────────────────────────────

    @Test
    void findAllEvents_sinEventos_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findAllEvents();
        assertThat(result).isNotNull().isEmpty();
    }

    @Test
    void findAllEvents_conEventos_retornaLista() {
        eventRepository.save(buildEvent("a@test.com"));
        eventRepository.save(buildEvent("b@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findAllEvents();
        assertThat(result).hasSize(2);
    }

    // ────────────────────────────────────────────────────────────────
    // findEventById
    // ────────────────────────────────────────────────────────────────

    @Test
    void findEventById_encontrado_retornaOptional() {
        RepositoryEventModel saved = eventRepository.save(buildEvent("c@test.com"));

        Optional<RepositoryEventModel> result = eventRepository.findEventById(saved.getIdEvent());
        assertThat(result).isPresent();
        assertThat(result.get().getContactEmail()).isEqualTo("c@test.com");
    }

    @Test
    void findEventById_noEncontrado_retornaEmpty() {
        Optional<RepositoryEventModel> result = eventRepository.findEventById(9999L);
        assertThat(result).isEmpty();
    }

    @Test
    void findEventById_idNulo_retornaEmpty() {
        Optional<RepositoryEventModel> result = eventRepository.findEventById(null);
        assertThat(result).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────
    // findEventByContactEmail
    // ────────────────────────────────────────────────────────────────

    @Test
    void findEventByContactEmail_encontrado_retornaOptional() {
        eventRepository.save(buildEvent("exact@test.com"));

        Optional<RepositoryEventModel> result = eventRepository.findEventByContactEmail("exact@test.com");
        assertThat(result).isPresent();
        assertThat(result.get().getContactEmail()).isEqualTo("exact@test.com");
    }

    @Test
    void findEventByContactEmail_noEncontrado_retornaEmpty() {
        Optional<RepositoryEventModel> result = eventRepository.findEventByContactEmail("noexi@st.com");
        assertThat(result).isEmpty();
    }

    @Test
    void findEventByContactEmail_emailNulo_retornaEmpty() {
        Optional<RepositoryEventModel> result = eventRepository.findEventByContactEmail(null);
        assertThat(result).isEmpty();
    }

    @Test
    void findEventByContactEmail_emailVacio_retornaEmpty() {
        Optional<RepositoryEventModel> result = eventRepository.findEventByContactEmail("");
        assertThat(result).isEmpty();
    }

    @Test
    void findEventByContactEmail_emailSoloEspacios_retornaEmpty() {
        Optional<RepositoryEventModel> result = eventRepository.findEventByContactEmail("   ");
        assertThat(result).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────
    // existsByContactEmail
    // ────────────────────────────────────────────────────────────────

    @Test
    void existsByContactEmail_existe_retornaTrue() {
        eventRepository.save(buildEvent("exists@test.com"));

        assertThat(eventRepository.existsByContactEmail("exists@test.com")).isTrue();
    }

    @Test
    void existsByContactEmail_noExiste_retornaFalse() {
        assertThat(eventRepository.existsByContactEmail("noexi@st.com")).isFalse();
    }

    @Test
    void existsByContactEmail_emailNulo_retornaFalse() {
        assertThat(eventRepository.existsByContactEmail(null)).isFalse();
    }

    @Test
    void existsByContactEmail_emailVacio_retornaFalse() {
        assertThat(eventRepository.existsByContactEmail("")).isFalse();
    }

    @Test
    void existsByContactEmail_emailSoloEspacios_retornaFalse() {
        assertThat(eventRepository.existsByContactEmail("   ")).isFalse();
    }

    // ────────────────────────────────────────────────────────────────
    // findEventsByTitle (case-insensitive, contains)
    // ────────────────────────────────────────────────────────────────

    @Test
    void findEventsByTitle_encontrado_retornaLista() {
        eventRepository.save(buildEvent("title1@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByTitle("Festival");
        assertThat(result).hasSize(1);
    }

    @Test
    void findEventsByTitle_caseInsensitive_retornaLista() {
        eventRepository.save(buildEvent("title2@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByTitle("festival");
        assertThat(result).hasSize(1);
    }

    @Test
    void findEventsByTitle_noEncontrado_retornaVacio() {
        eventRepository.save(buildEvent("title3@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByTitle("Inexistente");
        assertThat(result).isEmpty();
    }

    @Test
    void findEventsByTitle_tituloNulo_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByTitle(null);
        assertThat(result).isEmpty();
    }

    @Test
    void findEventsByTitle_tituloVacio_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByTitle("");
        assertThat(result).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────
    // findEventsByCategory (case-insensitive exact)
    // ────────────────────────────────────────────────────────────────

    @Test
    void findEventsByCategory_encontrado_retornaLista() {
        eventRepository.save(buildEvent("cat1@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByCategory("Música");
        assertThat(result).hasSize(1);
    }

    @Test
    void findEventsByCategory_caseInsensitive_retornaLista() {
        eventRepository.save(buildEvent("cat2@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByCategory("música");
        assertThat(result).hasSize(1);
    }

    @Test
    void findEventsByCategory_noEncontrado_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByCategory("Deportes");
        assertThat(result).isEmpty();
    }

    @Test
    void findEventsByCategory_categoriaNula_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByCategory(null);
        assertThat(result).isEmpty();
    }

    @Test
    void findEventsByCategory_categoriaVacia_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByCategory("");
        assertThat(result).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────
    // findEventsByLocation (case-insensitive, contains)
    // ────────────────────────────────────────────────────────────────

    @Test
    void findEventsByLocation_encontrado_retornaLista() {
        eventRepository.save(buildEvent("loc1@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByLocation("Madrid");
        assertThat(result).hasSize(1);
    }

    @Test
    void findEventsByLocation_caseInsensitive_retornaLista() {
        eventRepository.save(buildEvent("loc2@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByLocation("madrid");
        assertThat(result).hasSize(1);
    }

    @Test
    void findEventsByLocation_noEncontrado_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByLocation("Tokio");
        assertThat(result).isEmpty();
    }

    @Test
    void findEventsByLocation_ubicacionNula_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByLocation(null);
        assertThat(result).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────
    // findEventsByOrganized (case-insensitive, contains)
    // ────────────────────────────────────────────────────────────────

    @Test
    void findEventsByOrganized_encontrado_retornaLista() {
        eventRepository.save(buildEvent("org1@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByOrganized("Rock");
        assertThat(result).hasSize(1);
    }

    @Test
    void findEventsByOrganized_caseInsensitive_retornaLista() {
        eventRepository.save(buildEvent("org2@test.com"));

        Collection<RepositoryEventModel> result = eventRepository.findEventsByOrganized("rock");
        assertThat(result).hasSize(1);
    }

    @Test
    void findEventsByOrganized_noEncontrado_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByOrganized("Inexistente");
        assertThat(result).isEmpty();
    }

    @Test
    void findEventsByOrganized_organizadorNulo_retornaVacio() {
        Collection<RepositoryEventModel> result = eventRepository.findEventsByOrganized(null);
        assertThat(result).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────
    // delete
    // ────────────────────────────────────────────────────────────────

    @Test
    void delete_eventoExistente_eliminaDeDB() {
        RepositoryEventModel saved = eventRepository.save(buildEvent("del1@test.com"));
        assertThat(eventRepository.findEventById(saved.getIdEvent())).isPresent();

        eventRepository.delete(saved);

        assertThat(eventRepository.findEventById(saved.getIdEvent())).isEmpty();
    }

    @Test
    void delete_eventoNulo_noLanzaExcepcion() {
        // delete(null) no debería lanzar excepción según la implementación
        eventRepository.delete(null);
    }

    @Test
    void delete_eventoSinId_noLanzaExcepcion() {
        RepositoryEventModel sinId = buildEvent("noid@test.com");
        // sinId no fue guardado, no tiene ID
        eventRepository.delete(sinId);
    }
}
