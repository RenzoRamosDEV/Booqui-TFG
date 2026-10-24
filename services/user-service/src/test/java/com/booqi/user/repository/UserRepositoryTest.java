package com.booqi.user.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.booqi.user.config.JpaConfig;
import com.booqi.user.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(JpaConfig.class)
class UserRepositoryTest {

    private final UserRepository userRepository;

    private User usuario;

    UserRepositoryTest(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        usuario =
                User.builder()
                        .firstName("Juan")
                        .lastName("Pérez")
                        .dateOfBirth(LocalDate.of(1990, 5, 15))
                        .contactPhone("631835827")
                        .contactEmail("juan.perez@email.com")
                        .password("securepass123")
                        .role(User.Role.CUSTOMER)
                        .build();
    }

    @Test
    void save_cuandoDatosValidos_persisteYRetornaUsuario() {
        User guardado = userRepository.save(usuario);

        assertThat(guardado.getId()).isNotNull();
        assertThat(guardado.getFirstName()).isEqualTo("Juan");
        assertThat(guardado.getContactEmail()).isEqualTo("juan.perez@email.com");
    }

    @Test
    void save_rellenaIdYFechasDeAuditoria() {
        User guardado = userRepository.saveAndFlush(usuario);

        assertThat(guardado.getId()).isNotNull();
        assertThat(guardado.getCreatedAt()).isNotNull();
        assertThat(guardado.getUpdatedAt()).isNotNull();
    }

    @Test
    void update_avanzaUpdatedAtYConservaCreatedAt() throws InterruptedException {
        User guardado = userRepository.saveAndFlush(usuario);
        LocalDateTime createdAt = guardado.getCreatedAt();
        LocalDateTime updatedAtInicial = guardado.getUpdatedAt();
        Thread.sleep(5);

        guardado.setFirstName("Juanito");
        User actualizado = userRepository.saveAndFlush(guardado);

        assertThat(actualizado.getUpdatedAt()).isAfter(updatedAtInicial);
        assertThat(actualizado.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    void findAll_retornaTodosLosUsuarios() {
        userRepository.save(usuario);
        userRepository.save(
                User.builder()
                        .firstName("María")
                        .lastName("García")
                        .dateOfBirth(LocalDate.of(1995, 3, 20))
                        .contactEmail("maria.garcia@email.com")
                        .password("password123")
                        .role(User.Role.ADMIN)
                        .build());

        assertThat(userRepository.findAll()).hasSize(2);
    }

    @Test
    void findAll_cuandoNoHayUsuarios_retornaVacio() {
        assertThat(userRepository.findAll()).isEmpty();
    }

    @Test
    void findById_cuandoExiste_retornaUsuario() {
        User guardado = userRepository.save(usuario);

        Optional<User> resultado = userRepository.findById(guardado.getId());

        assertThat(resultado).isPresent();
        assertThat(resultado.get().getContactEmail()).isEqualTo("juan.perez@email.com");
    }

    @Test
    void findById_cuandoNoExiste_retornaVacio() {
        assertThat(userRepository.findById(999L)).isEmpty();
    }

    @Test
    void findByContactEmail_cuandoExiste_retornaUsuario() {
        userRepository.save(usuario);

        Optional<User> resultado = userRepository.findByContactEmail("juan.perez@email.com");

        assertThat(resultado).isPresent();
        assertThat(resultado.get().getFirstName()).isEqualTo("Juan");
    }

    @Test
    void findByContactEmail_cuandoNoExiste_retornaVacio() {
        assertThat(userRepository.findByContactEmail("inexistente@email.com")).isEmpty();
    }

    @Test
    void existsByContactEmail_cuandoExiste_retornaTrue() {
        userRepository.save(usuario);

        assertThat(userRepository.existsByContactEmail("juan.perez@email.com")).isTrue();
    }

    @Test
    void existsByContactEmail_cuandoNoExiste_retornaFalse() {
        assertThat(userRepository.existsByContactEmail("otro@email.com")).isFalse();
    }

    @Test
    void findByFirstNameIgnoreCase_cuandoExiste_retornaLista() {
        userRepository.save(usuario);

        List<User> resultado = userRepository.findByFirstNameIgnoreCase("Juan");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getFirstName()).isEqualTo("Juan");
    }

    @Test
    void findByFirstNameIgnoreCase_busquedaCaseInsensitive() {
        userRepository.save(usuario);

        assertThat(userRepository.findByFirstNameIgnoreCase("juan")).hasSize(1);
    }

    @Test
    void findByFirstNameIgnoreCase_cuandoNoExiste_retornaVacio() {
        assertThat(userRepository.findByFirstNameIgnoreCase("Inexistente")).isEmpty();
    }

    @Test
    void findByLastNameIgnoreCase_cuandoExiste_retornaLista() {
        userRepository.save(usuario);

        assertThat(userRepository.findByLastNameIgnoreCase("Pérez")).hasSize(1);
    }

    @Test
    void findByLastNameIgnoreCase_busquedaCaseInsensitive() {
        userRepository.save(usuario);

        assertThat(userRepository.findByLastNameIgnoreCase("pérez")).hasSize(1);
    }

    @Test
    void findByLastNameIgnoreCase_cuandoNoExiste_retornaVacio() {
        assertThat(userRepository.findByLastNameIgnoreCase("Inexistente")).isEmpty();
    }

    @Test
    void findByContactPhone_cuandoExiste_retornaLista() {
        userRepository.save(usuario);

        List<User> resultado = userRepository.findByContactPhone("631835827");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getContactPhone()).isEqualTo("631835827");
    }

    @Test
    void findByContactPhone_cuandoNoExiste_retornaVacio() {
        assertThat(userRepository.findByContactPhone("000000000")).isEmpty();
    }

    @Test
    void findByRole_cuandoExisten_retornaLista() {
        userRepository.save(usuario);

        assertThat(userRepository.findByRole(User.Role.CUSTOMER)).hasSize(1);
    }

    @Test
    void findByRole_cuandoRolNoCoincide_retornaVacio() {
        userRepository.save(usuario);

        assertThat(userRepository.findByRole(User.Role.ADMIN)).isEmpty();
    }

    @Test
    void findByFirstNameAndLastNameIgnoreCase_cuandoCoincide_retornaLista() {
        userRepository.save(usuario);

        assertThat(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("Juan", "Pérez"))
                .hasSize(1);
    }

    @Test
    void findByFirstNameAndLastNameIgnoreCase_busquedaCaseInsensitive() {
        userRepository.save(usuario);

        assertThat(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("juan", "pérez"))
                .hasSize(1);
    }

    @Test
    void findByFirstNameAndLastNameIgnoreCase_cuandoSoloNombreCoincide_retornaVacio() {
        userRepository.save(usuario);

        assertThat(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("Juan", "Otro"))
                .isEmpty();
    }

    @Test
    void delete_cuandoExiste_eliminaUsuario() {
        User guardado = userRepository.save(usuario);

        userRepository.delete(guardado);

        assertThat(userRepository.findById(guardado.getId())).isEmpty();
    }
}
