package org.service_user.user.repository.jpa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.service_user.user.repository.UserRepository;
import org.service_user.user.repository.model.RepositoryUserModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class UserRepositoryJPATest {

    @Autowired
    private UserRepositoryJPA userRepositoryJPA;

    private UserRepository userRepository;

    private RepositoryUserModel usuario;

    @BeforeEach
    void setUp() {
        userRepository = userRepositoryJPA;
        userRepositoryJPA.deleteAll();

        usuario = RepositoryUserModel.builder()
                .firstName("Juan")
                .lastName("Pérez")
                .dateOfBirth(LocalDate.of(1990, 5, 15))
                .contactPhone("631835827")
                .contactEmail("juan.perez@email.com")
                .password("securepass123")
                .role(RepositoryUserModel.Role.CUSTOMER)
                .build();
    }

    // -------------------------------------------------------------------------
    // save
    // -------------------------------------------------------------------------

    @Test
    void save_cuandoDatosValidos_persisteYRetornaUsuario() {
        RepositoryUserModel guardado = userRepository.save(usuario);

        assertThat(guardado.getIdUser()).isNotNull();
        assertThat(guardado.getFirstName()).isEqualTo("Juan");
        assertThat(guardado.getContactEmail()).isEqualTo("juan.perez@email.com");
    }

    @Test
    void save_cuandoUsuarioNulo_lanzaExcepcion() {
        assertThatThrownBy(() -> userRepository.save(null))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("nulo");
    }

    // -------------------------------------------------------------------------
    // findAllUser
    // -------------------------------------------------------------------------

    @Test
    void findAllUser_retornaTodosLosUsuarios() {
        userRepository.save(usuario);

        RepositoryUserModel segundo = RepositoryUserModel.builder()
                .firstName("María")
                .lastName("García")
                .dateOfBirth(LocalDate.of(1995, 3, 20))
                .contactEmail("maria.garcia@email.com")
                .password("password123")
                .role(RepositoryUserModel.Role.ADMIN)
                .build();
        userRepository.save(segundo);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findAllUser();

        assertThat(resultado).hasSize(2);
    }

    @Test
    void findAllUser_cuandoNoHayUsuarios_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findAllUser();

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // findUserById
    // -------------------------------------------------------------------------

    @Test
    void findUserById_cuandoExiste_retornaUsuario() {
        RepositoryUserModel guardado = userRepository.save(usuario);

        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserById(guardado.getIdUser());

        assertThat(resultado).isPresent();
        assertThat(resultado.get().getContactEmail()).isEqualTo("juan.perez@email.com");
    }

    @Test
    void findUserById_cuandoNoExiste_retornaVacio() {
        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserById(999L);

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserById_cuandoIdNulo_retornaVacio() {
        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserById(null);

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // findUserByContactEmail
    // -------------------------------------------------------------------------

    @Test
    void findUserByContactEmail_cuandoExiste_retornaUsuario() {
        userRepository.save(usuario);

        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserByContactEmail("juan.perez@email.com");

        assertThat(resultado).isPresent();
        assertThat(resultado.get().getFirstName()).isEqualTo("Juan");
    }

    @Test
    void findUserByContactEmail_cuandoNoExiste_retornaVacio() {
        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserByContactEmail("inexistente@email.com");

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByContactEmail_cuandoEmailNulo_retornaVacio() {
        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserByContactEmail(null);

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByContactEmail_cuandoEmailVacio_retornaVacio() {
        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserByContactEmail("  ");

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // existsByContactEmail
    // -------------------------------------------------------------------------

    @Test
    void existsByContactEmail_cuandoExiste_retornaTrue() {
        userRepository.save(usuario);

        boolean resultado = userRepositoryJPA.existsByContactEmail("juan.perez@email.com");

        assertThat(resultado).isTrue();
    }

    @Test
    void existsByContactEmail_cuandoNoExiste_retornaFalse() {
        boolean resultado = userRepositoryJPA.existsByContactEmail("otro@email.com");

        assertThat(resultado).isFalse();
    }

    @Test
    void existsByContactEmail_cuandoEmailNulo_retornaFalse() {
        boolean resultado = userRepositoryJPA.existsByContactEmail(null);

        assertThat(resultado).isFalse();
    }

    @Test
    void existsByContactEmail_cuandoEmailVacio_retornaFalse() {
        boolean resultado = userRepositoryJPA.existsByContactEmail("");

        assertThat(resultado).isFalse();
    }

    // -------------------------------------------------------------------------
    // findUserByFirstName
    // -------------------------------------------------------------------------

    @Test
    void findUserByFirstName_cuandoExiste_retornaColeccion() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByFirstName("Juan");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.iterator().next().getFirstName()).isEqualTo("Juan");
    }

    @Test
    void findUserByFirstName_busquedaCaseInsensitive() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByFirstName("juan");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void findUserByFirstName_cuandoNoExiste_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByFirstName("Inexistente");

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByFirstName_cuandoNombreNulo_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByFirstName(null);

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByFirstName_cuandoNombreVacio_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByFirstName("  ");

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // findUserByLastName
    // -------------------------------------------------------------------------

    @Test
    void findUserByLastName_cuandoExiste_retornaColeccion() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByLastName("Pérez");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void findUserByLastName_busquedaCaseInsensitive() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByLastName("pérez");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void findUserByLastName_cuandoNoExiste_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByLastName("Inexistente");

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByLastName_cuandoApellidoNulo_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByLastName(null);

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByLastName_cuandoApellidoVacio_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByLastName("");

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // findUserByContactPhone
    // -------------------------------------------------------------------------

    @Test
    void findUserByContactPhone_cuandoExiste_retornaUsuario() {
        userRepository.save(usuario);

        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserByContactPhone("631835827");

        assertThat(resultado).isPresent();
        assertThat(resultado.get().getContactPhone()).isEqualTo("631835827");
    }

    @Test
    void findUserByContactPhone_cuandoNoExiste_retornaVacio() {
        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserByContactPhone("000000000");

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByContactPhone_cuandoTelefonoNulo_retornaVacio() {
        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserByContactPhone(null);

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByContactPhone_cuandoTelefonoVacio_retornaVacio() {
        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserByContactPhone("  ");

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // findUserByRole
    // -------------------------------------------------------------------------

    @Test
    void findUserByRole_cuandoExisten_retornaColeccion() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByRole("CUSTOMER");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void findUserByRole_cuandoRolNoCoincide_retornaVacio() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByRole("ADMIN");

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByRole_cuandoRolInvalido_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByRole("ROL_INVALIDO");

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByRole_cuandoRolNulo_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByRole(null);

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserByRole_cuandoRolVacio_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserByRole("  ");

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // findUserFirstNameAndLastName
    // -------------------------------------------------------------------------

    @Test
    void findUserFirstNameAndLastName_cuandoCoincide_retornaColeccion() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserFirstNameAndLastName("Juan", "Pérez");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void findUserFirstNameAndLastName_busquedaCaseInsensitive() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserFirstNameAndLastName("juan", "pérez");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void findUserFirstNameAndLastName_cuandoSoloNombreCoincide_retornaVacio() {
        userRepository.save(usuario);

        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserFirstNameAndLastName("Juan", "Otro");

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserFirstNameAndLastName_cuandoNombreNulo_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserFirstNameAndLastName(null, "Pérez");

        assertThat(resultado).isEmpty();
    }

    @Test
    void findUserFirstNameAndLastName_cuandoApellidoNulo_retornaVacio() {
        Collection<RepositoryUserModel> resultado = userRepositoryJPA.findUserFirstNameAndLastName("Juan", null);

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // delete
    // -------------------------------------------------------------------------

    @Test
    void delete_cuandoExiste_eliminaUsuario() {
        RepositoryUserModel guardado = userRepository.save(usuario);

        userRepository.delete(guardado);

        Optional<RepositoryUserModel> resultado = userRepositoryJPA.findUserById(guardado.getIdUser());
        assertThat(resultado).isEmpty();
    }

    @Test
    void delete_cuandoUsuarioNulo_noLanzaExcepcion() {
        userRepository.delete(null);
    }

    @Test
    void delete_cuandoIdNulo_noLanzaExcepcion() {
        RepositoryUserModel sinId = RepositoryUserModel.builder()
                .firstName("Sin")
                .lastName("Id")
                .dateOfBirth(LocalDate.of(2000, 1, 1))
                .contactEmail("sinid@email.com")
                .password("password123")
                .role(RepositoryUserModel.Role.CUSTOMER)
                .build();

        userRepository.delete(sinId);
    }
}
