package com.booqi.event.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.booqi.event.config.JpaConfig;
import com.booqi.event.entity.Event;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(JpaConfig.class)
class EventRepositoryTest {

    private static final LocalDateTime FUTURE_START = LocalDateTime.now().plusDays(10);
    private static final LocalDateTime FUTURE_END = LocalDateTime.now().plusDays(11);

    private final EventRepository eventRepository;

    EventRepositoryTest(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @BeforeEach
    void setUp() {
        eventRepository.deleteAll();
    }

    private Event buildEvent(String email) {
        return Event.builder()
                .title("Festival de Música")
                .availableTickets(100)
                .location("Madrid")
                .startDate(FUTURE_START)
                .endDate(FUTURE_END)
                .organizer("Rock Prod")
                .price(45.50)
                .category("Música")
                .contactEmail(email)
                .contactPhone("910123456")
                .build();
    }

    @Test
    void save_eventoValido_persisteYRetornaConId() {
        Event saved = eventRepository.save(buildEvent("fest@test.com"));

        assertThat(saved.getId()).isNotNull().isPositive();
        assertThat(saved.getContactEmail()).isEqualTo("fest@test.com");
    }

    @Test
    void save_rellenaIdYFechasDeAuditoria() {
        Event saved = eventRepository.saveAndFlush(buildEvent("audit@test.com"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void update_avanzaUpdatedAtYConservaCreatedAt() throws InterruptedException {
        Event saved = eventRepository.saveAndFlush(buildEvent("upd@test.com"));
        LocalDateTime createdAt = saved.getCreatedAt();
        LocalDateTime updatedAtInicial = saved.getUpdatedAt();
        Thread.sleep(5);

        saved.setTitle("Festival Renovado");
        Event updated = eventRepository.saveAndFlush(saved);

        assertThat(updated.getUpdatedAt()).isAfter(updatedAtInicial);
        assertThat(updated.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    void save_emailDuplicado_violaRestriccionUnica() {
        eventRepository.saveAndFlush(buildEvent("dup@test.com"));

        assertThatThrownBy(() -> eventRepository.saveAndFlush(buildEvent("dup@test.com")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findAll_sinEventos_retornaVacio() {
        assertThat(eventRepository.findAll()).isEmpty();
    }

    @Test
    void findAll_conEventos_retornaLista() {
        eventRepository.save(buildEvent("a@test.com"));
        eventRepository.save(buildEvent("b@test.com"));

        assertThat(eventRepository.findAll()).hasSize(2);
    }

    @Test
    void findById_encontrado_retornaOptional() {
        Event saved = eventRepository.save(buildEvent("c@test.com"));

        Optional<Event> result = eventRepository.findById(saved.getId());
        assertThat(result).isPresent();
        assertThat(result.get().getContactEmail()).isEqualTo("c@test.com");
    }

    @Test
    void findById_noEncontrado_retornaEmpty() {
        assertThat(eventRepository.findById(9999L)).isEmpty();
    }

    @Test
    void findByContactEmail_encontrado_retornaOptional() {
        eventRepository.save(buildEvent("exact@test.com"));

        Optional<Event> result = eventRepository.findByContactEmail("exact@test.com");
        assertThat(result).isPresent();
        assertThat(result.get().getContactEmail()).isEqualTo("exact@test.com");
    }

    @Test
    void findByContactEmail_noEncontrado_retornaEmpty() {
        assertThat(eventRepository.findByContactEmail("noexi@st.com")).isEmpty();
    }

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
    void findByTitleContainingIgnoreCase_encontrado_retornaLista() {
        eventRepository.save(buildEvent("title1@test.com"));

        assertThat(eventRepository.findByTitleContainingIgnoreCase("Festival")).hasSize(1);
    }

    @Test
    void findByTitleContainingIgnoreCase_caseInsensitive_retornaLista() {
        eventRepository.save(buildEvent("title2@test.com"));

        assertThat(eventRepository.findByTitleContainingIgnoreCase("festival")).hasSize(1);
    }

    @Test
    void findByTitleContainingIgnoreCase_noEncontrado_retornaVacio() {
        eventRepository.save(buildEvent("title3@test.com"));

        assertThat(eventRepository.findByTitleContainingIgnoreCase("Inexistente")).isEmpty();
    }

    @Test
    void findByCategoryIgnoreCase_encontrado_retornaLista() {
        eventRepository.save(buildEvent("cat1@test.com"));

        assertThat(eventRepository.findByCategoryIgnoreCase("Música")).hasSize(1);
    }

    @Test
    void findByCategoryIgnoreCase_caseInsensitive_retornaLista() {
        eventRepository.save(buildEvent("cat2@test.com"));

        assertThat(eventRepository.findByCategoryIgnoreCase("música")).hasSize(1);
    }

    @Test
    void findByCategoryIgnoreCase_noEncontrado_retornaVacio() {
        assertThat(eventRepository.findByCategoryIgnoreCase("Deportes")).isEmpty();
    }

    @Test
    void findByLocationContainingIgnoreCase_encontrado_retornaLista() {
        eventRepository.save(buildEvent("loc1@test.com"));

        assertThat(eventRepository.findByLocationContainingIgnoreCase("Madrid")).hasSize(1);
    }

    @Test
    void findByLocationContainingIgnoreCase_caseInsensitive_retornaLista() {
        eventRepository.save(buildEvent("loc2@test.com"));

        assertThat(eventRepository.findByLocationContainingIgnoreCase("madrid")).hasSize(1);
    }

    @Test
    void findByLocationContainingIgnoreCase_noEncontrado_retornaVacio() {
        assertThat(eventRepository.findByLocationContainingIgnoreCase("Tokio")).isEmpty();
    }

    @Test
    void findByOrganizerContainingIgnoreCase_encontrado_retornaLista() {
        eventRepository.save(buildEvent("org1@test.com"));

        assertThat(eventRepository.findByOrganizerContainingIgnoreCase("Rock")).hasSize(1);
    }

    @Test
    void findByOrganizerContainingIgnoreCase_caseInsensitive_retornaLista() {
        eventRepository.save(buildEvent("org2@test.com"));

        assertThat(eventRepository.findByOrganizerContainingIgnoreCase("rock")).hasSize(1);
    }

    @Test
    void findByOrganizerContainingIgnoreCase_noEncontrado_retornaVacio() {
        List<Event> result = eventRepository.findByOrganizerContainingIgnoreCase("Inexistente");
        assertThat(result).isEmpty();
    }

    @Test
    void delete_eventoExistente_eliminaDeDB() {
        Event saved = eventRepository.save(buildEvent("del1@test.com"));

        eventRepository.delete(saved);

        assertThat(eventRepository.findById(saved.getId())).isEmpty();
    }
}
