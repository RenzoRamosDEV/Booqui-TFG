package com.booqi.user.service.impl;

import com.booqi.user.dto.request.CreateUserRequest;
import com.booqi.user.dto.request.LoginRequest;
import com.booqi.user.dto.request.UpdateUserRequest;
import com.booqi.user.dto.request.UserFilter;
import com.booqi.user.dto.response.UserResponse;
import com.booqi.user.entity.User;
import com.booqi.user.exception.ConflictException;
import com.booqi.user.exception.InvalidCredentialsException;
import com.booqi.user.exception.InvalidFilterException;
import com.booqi.user.exception.ResourceNotFoundException;
import com.booqi.user.mapper.UserMapper;
import com.booqi.user.mapper.UserMapperImpl;
import com.booqi.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Spy
    private UserMapper userMapper = new UserMapperImpl();

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User juan;
    private CreateUserRequest createRequest;

    @BeforeEach
    void setUp() {
        juan = User.builder()
                .id(1L)
                .firstName("Juan")
                .lastName("Pérez")
                .dateOfBirth(LocalDate.of(1990, 5, 15))
                .contactPhone("631835827")
                .contactEmail("juan.perez@email.com")
                .password("$2a$10$storedhash")
                .role(User.Role.CUSTOMER)
                .build();
        createRequest = createRequestWithRole("ADMIN");
    }

    private static CreateUserRequest createRequestWithRole(String role) {
        return new CreateUserRequest("Juan", "Pérez", LocalDate.of(1990, 5, 15), "631835827",
                "juan.perez@email.com", "securepass123", role);
    }

    private static UpdateUserRequest update(String contactEmail, String password, String role) {
        return new UpdateUserRequest(null, null, null, null, contactEmail, password, role);
    }

    private User savedUser() {
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        return captor.getValue();
    }

    // create

    @Test
    void create_cuandoDatosValidos_guardaYRetornaUsuario() {
        when(userRepository.existsByContactEmail("juan.perez@email.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(5L);
            return u;
        });

        UserResponse resultado = userService.create(createRequest);

        assertThat(resultado.id()).isEqualTo(5L);
        assertThat(resultado.contactEmail()).isEqualTo("juan.perez@email.com");
        assertThat(resultado.role()).isEqualTo("ADMIN");
        assertThat(savedUser().getRole()).isEqualTo(User.Role.ADMIN);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void create_cuandoRolAusenteOVacio_asignaCustomer(String role) {
        when(userRepository.existsByContactEmail(any())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse resultado = userService.create(createRequestWithRole(role));

        assertThat(resultado.role()).isEqualTo("CUSTOMER");
    }

    @Test
    void create_cuandoEmailDuplicado_lanzaConflictYNoGuarda() {
        when(userRepository.existsByContactEmail("juan.perez@email.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.create(createRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessage("User with contactEmail juan.perez@email.com already exists");
        verify(userRepository, never()).save(any());
    }

    // findAll / findById / existsById

    @Test
    void findAll_retornaTodosMapeados() {
        when(userRepository.findAll()).thenReturn(List.of(juan));

        assertThat(userService.findAll()).extracting(UserResponse::id).containsExactly(1L);
    }

    @Test
    void findById_cuandoExiste_retornaUsuario() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));

        assertThat(userService.findById(1L).contactEmail()).isEqualTo("juan.perez@email.com");
    }

    @Test
    void findById_cuandoNoExiste_lanzaResourceNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User with id 99 not found");
    }

    @Test
    void existsById_reflejaElRepositorio() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.existsById(2L)).thenReturn(false);

        assertThat(userService.existsById(1L)).isTrue();
        assertThat(userService.existsById(2L)).isFalse();
    }

    // findBy*

    @Test
    void findByContactEmail_cuandoExiste_retornaListaConElUsuario() {
        when(userRepository.findByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(juan));

        assertThat(userService.findByContactEmail("juan.perez@email.com"))
                .extracting(UserResponse::id).containsExactly(1L);
    }

    @Test
    void findByContactEmail_cuandoNoExiste_retornaListaVacia() {
        when(userRepository.findByContactEmail("nobody@booqi.com")).thenReturn(Optional.empty());

        assertThat(userService.findByContactEmail("nobody@booqi.com")).isEmpty();
    }

    @Test
    void findByContactPhone_retornaLista() {
        when(userRepository.findByContactPhone("631835827")).thenReturn(List.of(juan));

        assertThat(userService.findByContactPhone("631835827")).extracting(UserResponse::id).containsExactly(1L);
    }

    @Test
    void findByRole_ignoraMayusculas() {
        when(userRepository.findByRole(User.Role.ADMIN)).thenReturn(List.of(juan));

        assertThat(userService.findByRole("admin")).hasSize(1);
    }

    @Test
    void findByRole_cuandoRolDesconocido_retornaVacioSinConsultar() {
        assertThat(userService.findByRole("SUPERUSER")).isEmpty();
        verifyNoInteractions(userRepository);
    }

    @Test
    void findByFirstName_retornaLista() {
        when(userRepository.findByFirstNameIgnoreCase("MEL")).thenReturn(List.of(juan));

        assertThat(userService.findByFirstName("MEL")).hasSize(1);
    }

    @Test
    void findByLastName_retornaLista() {
        when(userRepository.findByLastNameIgnoreCase("pérez")).thenReturn(List.of(juan));

        assertThat(userService.findByLastName("pérez")).hasSize(1);
    }

    @Test
    void findByFirstNameAndLastName_retornaLista() {
        when(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("juan", "pérez")).thenReturn(List.of(juan));

        assertThat(userService.findByFirstNameAndLastName("juan", "pérez")).hasSize(1);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void findBy_cuandoArgumentoEnBlanco_retornaVacioSinConsultar(String blank) {
        assertThat(userService.findByContactEmail(blank)).isEmpty();
        assertThat(userService.findByContactPhone(blank)).isEmpty();
        assertThat(userService.findByRole(blank)).isEmpty();
        assertThat(userService.findByFirstName(blank)).isEmpty();
        assertThat(userService.findByLastName(blank)).isEmpty();
        assertThat(userService.findByFirstNameAndLastName(blank, "Pérez")).isEmpty();
        assertThat(userService.findByFirstNameAndLastName("Juan", blank)).isEmpty();
        verifyNoInteractions(userRepository);
    }

    // findAll(UserFilter)

    @Test
    void findAllFiltro_sinFiltros_retornaTodos() {
        when(userRepository.findAll()).thenReturn(List.of(juan));

        assertThat(userService.findAll(new UserFilter(null, null, null, null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_soloFiltrosEnBlanco_retornaTodos() {
        when(userRepository.findAll()).thenReturn(List.of(juan));

        assertThat(userService.findAll(new UserFilter("", " ", "  ", "", " "))).hasSize(1);
    }

    @Test
    void findAllFiltro_porContactEmail() {
        when(userRepository.findByContactEmail("mel@booqi.com")).thenReturn(Optional.of(juan));

        assertThat(userService.findAll(new UserFilter("mel@booqi.com", null, null, null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_porContactPhone() {
        when(userRepository.findByContactPhone("631835827")).thenReturn(List.of(juan));

        assertThat(userService.findAll(new UserFilter(null, "631835827", null, null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_porRole() {
        when(userRepository.findByRole(User.Role.ADMIN)).thenReturn(List.of(juan));

        assertThat(userService.findAll(new UserFilter(null, null, "ADMIN", null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_porFirstName() {
        when(userRepository.findByFirstNameIgnoreCase("Mel")).thenReturn(List.of(juan));

        assertThat(userService.findAll(new UserFilter(null, null, null, "Mel", null))).hasSize(1);
    }

    @Test
    void findAllFiltro_porLastName() {
        when(userRepository.findByLastNameIgnoreCase("Admin")).thenReturn(List.of(juan));

        assertThat(userService.findAll(new UserFilter(null, null, null, null, "Admin"))).hasSize(1);
    }

    @Test
    void findAllFiltro_porNombreCompleto() {
        when(userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase("mel", "admin")).thenReturn(List.of(juan));

        assertThat(userService.findAll(new UserFilter(null, null, null, "mel", "admin"))).hasSize(1);
    }

    @Test
    void findAllFiltro_filtroEnBlancoSeIgnora() {
        when(userRepository.findByRole(User.Role.ADMIN)).thenReturn(List.of(juan));

        assertThat(userService.findAll(new UserFilter("", null, "ADMIN", null, null))).hasSize(1);
    }

    @Test
    void findAllFiltro_dosFiltrosExclusivos_lanzaInvalidFilterSinConsultar() {
        assertThatThrownBy(() -> userService.findAll(new UserFilter("mel@booqi.com", null, "ADMIN", null, null)))
                .isInstanceOf(InvalidFilterException.class)
                .hasMessage("Only one filter may be used at a time (firstName and lastName may be combined)");
        verifyNoInteractions(userRepository);
    }

    @Test
    void findAllFiltro_nombreCompletoMasRol_lanzaInvalidFilter() {
        assertThatThrownBy(() -> userService.findAll(new UserFilter(null, null, "ADMIN", "Mel", "Admin")))
                .isInstanceOf(InvalidFilterException.class);
        verifyNoInteractions(userRepository);
    }

    @Test
    void findAllFiltro_nombreMasTelefono_lanzaInvalidFilter() {
        assertThatThrownBy(() -> userService.findAll(new UserFilter(null, "631835827", null, "Mel", null)))
                .isInstanceOf(InvalidFilterException.class);
        verifyNoInteractions(userRepository);
    }

    @Test
    void findAllFiltro_apellidoMasEmail_lanzaInvalidFilter() {
        assertThatThrownBy(() -> userService.findAll(new UserFilter("mel@booqi.com", null, null, null, "Admin")))
                .isInstanceOf(InvalidFilterException.class);
        verifyNoInteractions(userRepository);
    }

    // update

    @Test
    void update_cuandoNoExiste_lanzaResourceNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.update(99L, update(null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User with id 99 not found");
        verify(userRepository, never()).save(any());
    }

    @Test
    void update_cuandoNuevoEmailDuplicado_lanzaConflictYNoGuarda() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));
        when(userRepository.existsByContactEmail("mel@booqi.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.update(1L, update("mel@booqi.com", null, null)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("User with contactEmail mel@booqi.com already exists");
        verify(userRepository, never()).save(any());
        assertThat(juan.getContactEmail()).isEqualTo("juan.perez@email.com");
    }

    @Test
    void update_cuandoMismoEmail_noCompruebaDuplicado() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));
        when(userRepository.save(juan)).thenReturn(juan);

        userService.update(1L, update("juan.perez@email.com", null, null));

        verify(userRepository, never()).existsByContactEmail(any());
    }

    @Test
    void update_cuandoNuevoEmailLibre_loAplica() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));
        when(userRepository.existsByContactEmail("nuevo@booqi.com")).thenReturn(false);
        when(userRepository.save(juan)).thenReturn(juan);

        UserResponse resultado = userService.update(1L, update("nuevo@booqi.com", null, null));

        assertThat(resultado.contactEmail()).isEqualTo("nuevo@booqi.com");
    }

    @Test
    void update_parcialSoloCambiaLosCamposPresentes() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));
        when(userRepository.save(juan)).thenReturn(juan);

        UserResponse resultado = userService.update(1L,
                new UpdateUserRequest("Andy", null, null, null, null, null, null));

        assertThat(resultado.firstName()).isEqualTo("Andy");
        assertThat(resultado.lastName()).isEqualTo("Pérez");
        assertThat(resultado.role()).isEqualTo("CUSTOMER");
        assertThat(juan.getPassword()).isEqualTo("$2a$10$storedhash");
    }

    @Test
    void update_cuandoRolConTexto_loAplica() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));
        when(userRepository.save(juan)).thenReturn(juan);

        assertThat(userService.update(1L, update(null, null, "ADMIN")).role()).isEqualTo("ADMIN");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "  ")
    void update_cuandoRolVacio_mantieneElRol(String role) {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));
        when(userRepository.save(juan)).thenReturn(juan);

        assertThat(userService.update(1L, update(null, null, role)).role()).isEqualTo("CUSTOMER");
    }

    // delete

    @Test
    void delete_cuandoExiste_eliminaPorId() {
        when(userRepository.existsById(1L)).thenReturn(true);

        userService.delete(1L);

        verify(userRepository).deleteById(1L);
    }

    @Test
    void delete_cuandoNoExiste_lanzaResourceNotFoundSinBorrar() {
        when(userRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> userService.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User with id 99 not found");
        verify(userRepository, never()).deleteById(any());
    }

    // passwords

    @Test
    void create_guardaPasswordCodificada() {
        when(userRepository.existsByContactEmail(any())).thenReturn(false);
        when(passwordEncoder.encode("securepass123")).thenReturn("ENCODED");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.create(createRequest);

        assertThat(savedUser().getPassword()).isEqualTo("ENCODED");
    }

    @Test
    void create_conBCryptReal_guardaHashYNoElTextoPlano() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
        UserServiceImpl realService = new UserServiceImpl(userRepository, userMapper, encoder);
        when(userRepository.existsByContactEmail(any())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        realService.create(createRequest);

        String stored = savedUser().getPassword();
        assertThat(stored).startsWith("$2").isNotEqualTo("securepass123");
        assertThat(encoder.matches("securepass123", stored)).isTrue();
    }

    @Test
    void update_conPassword_laVuelveACodificar() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));
        when(passwordEncoder.encode("newpassword1")).thenReturn("NEW_HASH");
        when(userRepository.save(juan)).thenReturn(juan);

        userService.update(1L, update(null, "newpassword1", null));

        assertThat(juan.getPassword()).isEqualTo("NEW_HASH");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void update_sinPassword_conservaElHashYNoCodifica(String password) {
        when(userRepository.findById(1L)).thenReturn(Optional.of(juan));
        when(userRepository.save(juan)).thenReturn(juan);

        userService.update(1L, update(null, password, null));

        assertThat(juan.getPassword()).isEqualTo("$2a$10$storedhash");
        verify(passwordEncoder, never()).encode(anyString());
    }

    // login

    @Test
    void login_cuandoPasswordCoincideConHash_retornaUsuario() {
        when(userRepository.findByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(juan));
        when(passwordEncoder.matches("securepass123", "$2a$10$storedhash")).thenReturn(true);

        UserResponse resultado = userService.login(new LoginRequest("juan.perez@email.com", "securepass123"));

        assertThat(resultado.id()).isEqualTo(1L);
    }

    @Test
    void login_cuandoEmailDesconocido_lanzaInvalidCredentials() {
        when(userRepository.findByContactEmail("nobody@booqi.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(new LoginRequest("nobody@booqi.com", "whatever1")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void login_cuandoPasswordNoCoincide_lanzaInvalidCredentialsConMismoMensaje() {
        when(userRepository.findByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(juan));
        when(passwordEncoder.matches("wrong-pass", "$2a$10$storedhash")).thenReturn(false);

        assertThatThrownBy(() -> userService.login(new LoginRequest("juan.perez@email.com", "wrong-pass")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email or password");
    }
}
