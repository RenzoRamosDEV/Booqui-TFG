package org.service_user.user.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.service_user.user.repository.UserRepository;
import org.service_user.user.repository.model.RepositoryUserModel;
import org.service_user.user.service.model.*;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ServiceUserMapper serviceUserMapper;

    @InjectMocks
    private UserServiceImpl userService;

    private RepositoryUserModel repositoryUser;
    private UserResponseDTO userResponseDTO;
    private UserCreateDTO userCreateDTO;

    @BeforeEach
    void setUp() {
        repositoryUser = RepositoryUserModel.builder()
                .idUser(1L)
                .firstName("Juan")
                .lastName("Pérez")
                .dateOfBirth(LocalDate.of(1990, 5, 15))
                .contactPhone("631835827")
                .contactEmail("juan.perez@email.com")
                .password("securepass123")
                .role(RepositoryUserModel.Role.CUSTOMER)
                .build();

        userResponseDTO = UserResponseDTO.builder()
                .idUser(1L)
                .firstName("Juan")
                .lastName("Pérez")
                .dateOfBirth(LocalDate.of(1990, 5, 15))
                .contactPhone("631835827")
                .contactEmail("juan.perez@email.com")
                .role("CUSTOMER")
                .build();

        userCreateDTO = UserCreateDTO.builder()
                .firstName("Juan")
                .lastName("Pérez")
                .dateOfBirth(LocalDate.of(1990, 5, 15))
                .contactPhone("631835827")
                .contactEmail("juan.perez@email.com")
                .password("securepass123")
                .role("CUSTOMER")
                .build();
    }

    // -------------------------------------------------------------------------
    // createUser
    // -------------------------------------------------------------------------

    @Test
    void createUser_cuandoDatosValidos_retornaUsuarioCreado() {
        when(userRepository.existsByContactEmail(userCreateDTO.getContactEmail())).thenReturn(false);
        when(serviceUserMapper.toRepositoryUserModel(userCreateDTO)).thenReturn(repositoryUser);
        when(userRepository.save(repositoryUser)).thenReturn(repositoryUser);
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        UserResponseDTO resultado = userService.createUser(userCreateDTO);

        assertThat(resultado).isEqualTo(userResponseDTO);
        verify(userRepository).save(repositoryUser);
    }

    @Test
    void createUser_cuandoRolNulo_asignaRolPorDefectoCustomer() {
        userCreateDTO.setRole(null);
        when(userRepository.existsByContactEmail(anyString())).thenReturn(false);
        when(serviceUserMapper.toRepositoryUserModel(any(UserCreateDTO.class))).thenReturn(repositoryUser);
        when(userRepository.save(repositoryUser)).thenReturn(repositoryUser);
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        userService.createUser(userCreateDTO);

        assertThat(userCreateDTO.getRole()).isEqualTo("CUSTOMER");
    }

    @Test
    void createUser_cuandoRolVacio_asignaRolPorDefectoCustomer() {
        userCreateDTO.setRole("   ");
        when(userRepository.existsByContactEmail(anyString())).thenReturn(false);
        when(serviceUserMapper.toRepositoryUserModel(any(UserCreateDTO.class))).thenReturn(repositoryUser);
        when(userRepository.save(repositoryUser)).thenReturn(repositoryUser);
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        userService.createUser(userCreateDTO);

        assertThat(userCreateDTO.getRole()).isEqualTo("CUSTOMER");
    }

    @Test
    void createUser_cuandoEmailYaExiste_lanzaIllegalStateException() {
        when(userRepository.existsByContactEmail(userCreateDTO.getContactEmail())).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(userCreateDTO))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(userCreateDTO.getContactEmail());
    }

    @Test
    void createUser_cuandoDatosNulos_lanzaIllegalArgumentException() {
        assertThatThrownBy(() -> userService.createUser(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // -------------------------------------------------------------------------
    // getAllUsers
    // -------------------------------------------------------------------------

    @Test
    void getAllUsers_retornaColeccionDeUsuarios() {
        when(userRepository.findAllUser()).thenReturn(List.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTOCollection(any())).thenReturn(List.of(userResponseDTO));

        Collection<UserResponseDTO> resultado = userService.getAllUsers();

        assertThat(resultado).hasSize(1);
        verify(userRepository).findAllUser();
    }

    @Test
    void getAllUsers_cuandoNoHayUsuarios_retornaColeccionVacia() {
        when(userRepository.findAllUser()).thenReturn(List.of());
        when(serviceUserMapper.toUserResponseDTOCollection(any())).thenReturn(List.of());

        Collection<UserResponseDTO> resultado = userService.getAllUsers();

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // getUserById
    // -------------------------------------------------------------------------

    @Test
    void getUserById_cuandoExiste_retornaUsuario() {
        when(userRepository.findUserById(1L)).thenReturn(Optional.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        Optional<UserResponseDTO> resultado = userService.getUserById(1L);

        assertThat(resultado).isPresent().contains(userResponseDTO);
    }

    @Test
    void getUserById_cuandoNoExiste_retornaVacio() {
        when(userRepository.findUserById(99L)).thenReturn(Optional.empty());

        Optional<UserResponseDTO> resultado = userService.getUserById(99L);

        assertThat(resultado).isEmpty();
    }

    @Test
    void getUserById_cuandoIdNulo_retornaVacio() {
        Optional<UserResponseDTO> resultado = userService.getUserById(null);

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserById(any());
    }

    // -------------------------------------------------------------------------
    // getUserByContactEmail
    // -------------------------------------------------------------------------

    @Test
    void getUserByContactEmail_cuandoExiste_retornaUsuario() {
        when(userRepository.findUserByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        Optional<UserResponseDTO> resultado = userService.getUserByContactEmail("juan.perez@email.com");

        assertThat(resultado).isPresent().contains(userResponseDTO);
    }

    @Test
    void getUserByContactEmail_cuandoNoExiste_retornaVacio() {
        when(userRepository.findUserByContactEmail("otro@email.com")).thenReturn(Optional.empty());

        Optional<UserResponseDTO> resultado = userService.getUserByContactEmail("otro@email.com");

        assertThat(resultado).isEmpty();
    }

    @Test
    void getUserByContactEmail_cuandoEmailNulo_retornaVacio() {
        Optional<UserResponseDTO> resultado = userService.getUserByContactEmail(null);

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByContactEmail(any());
    }

    @Test
    void getUserByContactEmail_cuandoEmailVacio_retornaVacio() {
        Optional<UserResponseDTO> resultado = userService.getUserByContactEmail("  ");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByContactEmail(any());
    }

    // -------------------------------------------------------------------------
    // getUsersByFirstName
    // -------------------------------------------------------------------------

    @Test
    void getUsersByFirstName_cuandoExisten_retornaColeccion() {
        when(userRepository.findUserByFirstName("Juan")).thenReturn(List.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTOCollection(any())).thenReturn(List.of(userResponseDTO));

        Collection<UserResponseDTO> resultado = userService.getUsersByFirstName("Juan");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void getUsersByFirstName_cuandoNombreNulo_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByFirstName(null);

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByFirstName(any());
    }

    @Test
    void getUsersByFirstName_cuandoNombreVacio_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByFirstName("  ");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByFirstName(any());
    }

    // -------------------------------------------------------------------------
    // getUsersByLastName
    // -------------------------------------------------------------------------

    @Test
    void getUsersByLastName_cuandoExisten_retornaColeccion() {
        when(userRepository.findUserByLastName("Pérez")).thenReturn(List.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTOCollection(any())).thenReturn(List.of(userResponseDTO));

        Collection<UserResponseDTO> resultado = userService.getUsersByLastName("Pérez");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void getUsersByLastName_cuandoApellidoNulo_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByLastName(null);

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByLastName(any());
    }

    @Test
    void getUsersByLastName_cuandoApellidoVacio_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByLastName("");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByLastName(any());
    }

    // -------------------------------------------------------------------------
    // getUsersByFullName
    // -------------------------------------------------------------------------

    @Test
    void getUsersByFullName_cuandoExisten_retornaColeccion() {
        when(userRepository.findUserFirstNameAndLastName("Juan", "Pérez")).thenReturn(List.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTOCollection(any())).thenReturn(List.of(userResponseDTO));

        Collection<UserResponseDTO> resultado = userService.getUsersByFullName("Juan", "Pérez");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void getUsersByFullName_cuandoNombreNulo_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByFullName(null, "Pérez");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserFirstNameAndLastName(any(), any());
    }

    @Test
    void getUsersByFullName_cuandoApellidoNulo_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByFullName("Juan", null);

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserFirstNameAndLastName(any(), any());
    }

    @Test
    void getUsersByFullName_cuandoAmbosVacios_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByFullName("", "");

        assertThat(resultado).isEmpty();
    }

    // -------------------------------------------------------------------------
    // getUserByContactPhone
    // -------------------------------------------------------------------------

    @Test
    void getUserByContactPhone_cuandoExiste_retornaUsuario() {
        when(userRepository.findUserByContactPhone("631835827")).thenReturn(Optional.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        Optional<UserResponseDTO> resultado = userService.getUserByContactPhone("631835827");

        assertThat(resultado).isPresent().contains(userResponseDTO);
    }

    @Test
    void getUserByContactPhone_cuandoNoExiste_retornaVacio() {
        when(userRepository.findUserByContactPhone("000000000")).thenReturn(Optional.empty());

        Optional<UserResponseDTO> resultado = userService.getUserByContactPhone("000000000");

        assertThat(resultado).isEmpty();
    }

    @Test
    void getUserByContactPhone_cuandoTelefonoNulo_retornaVacio() {
        Optional<UserResponseDTO> resultado = userService.getUserByContactPhone(null);

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByContactPhone(any());
    }

    @Test
    void getUserByContactPhone_cuandoTelefonoVacio_retornaVacio() {
        Optional<UserResponseDTO> resultado = userService.getUserByContactPhone("  ");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByContactPhone(any());
    }

    // -------------------------------------------------------------------------
    // getUsersByRole
    // -------------------------------------------------------------------------

    @Test
    void getUsersByRole_cuandoExisten_retornaColeccion() {
        when(userRepository.findUserByRole("CUSTOMER")).thenReturn(List.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTOCollection(any())).thenReturn(List.of(userResponseDTO));

        Collection<UserResponseDTO> resultado = userService.getUsersByRole("CUSTOMER");

        assertThat(resultado).hasSize(1);
    }

    @Test
    void getUsersByRole_cuandoRolNulo_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByRole(null);

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByRole(any());
    }

    @Test
    void getUsersByRole_cuandoRolVacio_retornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByRole("  ");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByRole(any());
    }

    // -------------------------------------------------------------------------
    // updateUserByEmail
    // -------------------------------------------------------------------------

    @Test
    void updateUserByEmail_cuandoDatosValidos_retornaUsuarioActualizado() {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder()
                .firstName("Carlos")
                .build();

        when(userRepository.findUserByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(repositoryUser));
        when(userRepository.save(repositoryUser)).thenReturn(repositoryUser);
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        UserResponseDTO resultado = userService.updateUserByEmail("juan.perez@email.com", updateDTO);

        assertThat(resultado).isEqualTo(userResponseDTO);
        verify(serviceUserMapper).updateRepositoryUserModelFromDTO(updateDTO, repositoryUser);
    }

    @Test
    void updateUserByEmail_cuandoNuevoEmailYaExiste_lanzaIllegalStateException() {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder()
                .contactEmail("otro@email.com")
                .build();

        when(userRepository.findUserByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(repositoryUser));
        when(userRepository.existsByContactEmail("otro@email.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUserByEmail("juan.perez@email.com", updateDTO))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("otro@email.com");
    }

    @Test
    void updateUserByEmail_cuandoUsuarioNoExiste_lanzaIllegalStateException() {
        when(userRepository.findUserByContactEmail("inexistente@email.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUserByEmail("inexistente@email.com", UserUpdateDTO.builder().build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("inexistente@email.com");
    }

    @Test
    void updateUserByEmail_cuandoEmailNulo_lanzaIllegalArgumentException() {
        assertThatThrownBy(() -> userService.updateUserByEmail(null, UserUpdateDTO.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateUserByEmail_cuandoUpdateDTONulo_lanzaIllegalArgumentException() {
        assertThatThrownBy(() -> userService.updateUserByEmail("juan.perez@email.com", null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateUserByEmail_cuandoNuevoEmailEsElMismo_noVerificaDuplicado() {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder()
                .contactEmail("juan.perez@email.com")
                .build();

        when(userRepository.findUserByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(repositoryUser));
        when(userRepository.save(repositoryUser)).thenReturn(repositoryUser);
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        userService.updateUserByEmail("juan.perez@email.com", updateDTO);

        verify(userRepository, never()).existsByContactEmail(anyString());
    }

    // -------------------------------------------------------------------------
    // deleteUserByEmail
    // -------------------------------------------------------------------------

    @Test
    void deleteUserByEmail_cuandoExiste_eliminaUsuario() {
        when(userRepository.findUserByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(repositoryUser));

        userService.deleteUserByEmail("juan.perez@email.com");

        verify(userRepository).delete(repositoryUser);
    }

    @Test
    void deleteUserByEmail_cuandoNoExiste_lanzaIllegalStateException() {
        when(userRepository.findUserByContactEmail("inexistente@email.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUserByEmail("inexistente@email.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("inexistente@email.com");
    }

    @Test
    void deleteUserByEmail_cuandoEmailNulo_lanzaIllegalArgumentException() {
        assertThatThrownBy(() -> userService.deleteUserByEmail(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteUserByEmail_cuandoEmailVacio_lanzaIllegalArgumentException() {
        assertThatThrownBy(() -> userService.deleteUserByEmail(""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // -------------------------------------------------------------------------
    // existsByContactEmail
    // -------------------------------------------------------------------------

    @Test
    void existsByContactEmail_cuandoExiste_retornaTrue() {
        when(userRepository.existsByContactEmail("juan.perez@email.com")).thenReturn(true);

        boolean resultado = userService.existsByContactEmail("juan.perez@email.com");

        assertThat(resultado).isTrue();
    }

    @Test
    void existsByContactEmail_cuandoNoExiste_retornaFalse() {
        when(userRepository.existsByContactEmail("otro@email.com")).thenReturn(false);

        boolean resultado = userService.existsByContactEmail("otro@email.com");

        assertThat(resultado).isFalse();
    }

    @Test
    void existsByContactEmail_cuandoEmailNulo_retornaFalse() {
        boolean resultado = userService.existsByContactEmail(null);

        assertThat(resultado).isFalse();
        verify(userRepository, never()).existsByContactEmail(any());
    }

    @Test
    void existsByContactEmail_cuandoEmailVacio_retornaFalse() {
        boolean resultado = userService.existsByContactEmail("  ");

        assertThat(resultado).isFalse();
        verify(userRepository, never()).existsByContactEmail(any());
    }

    // -------------------------------------------------------------------------
    // verifyLogin
    // -------------------------------------------------------------------------

    @Test
    void verifyLogin_cuandoCredencialesCorrectas_retornaLoginExitoso() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .contactEmail("juan.perez@email.com")
                .password("securepass123")
                .build();

        when(userRepository.findUserByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(repositoryUser));
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        LoginResponseDTO resultado = userService.verifyLogin(request);

        assertThat(resultado.isSuccess()).isTrue();
        assertThat(resultado.getMessage()).isEqualTo("Login exitoso");
        assertThat(resultado.getUser()).isEqualTo(userResponseDTO);
    }

    @Test
    void verifyLogin_cuandoEmailNoExiste_retornaLoginFallido() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .contactEmail("inexistente@email.com")
                .password("securepass123")
                .build();

        when(userRepository.findUserByContactEmail("inexistente@email.com")).thenReturn(Optional.empty());

        LoginResponseDTO resultado = userService.verifyLogin(request);

        assertThat(resultado.isSuccess()).isFalse();
        assertThat(resultado.getMessage()).isEqualTo("Email o contraseña incorrectos");
        assertThat(resultado.getUser()).isNull();
    }

    @Test
    void verifyLogin_cuandoPasswordIncorrecta_retornaLoginFallido() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .contactEmail("juan.perez@email.com")
                .password("wrongpassword")
                .build();

        when(userRepository.findUserByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(repositoryUser));

        LoginResponseDTO resultado = userService.verifyLogin(request);

        assertThat(resultado.isSuccess()).isFalse();
        assertThat(resultado.getMessage()).isEqualTo("Email o contraseña incorrectos");
    }

    @Test
    void verifyLogin_cuandoRequestNulo_lanzaNullPointerException() {
        assertThatThrownBy(() -> userService.verifyLogin(null))
                .isInstanceOf(NullPointerException.class);
    }

    // =========================================================================
    // TESTS PARA MATAR MUTANTES SOBREVIVIENTES
    // =========================================================================

    // --- createUser L39: REMOVE_CONDITIONALS_EQUAL_ELSE elimina || trim().isEmpty() ---
    // Mutante: if (role == null) sin el isEmpty() → "   " no activa el default
    // Necesitamos capturar el DTO que llega al mapper y verificar role="CUSTOMER"

    @Test
    void createUser_cuandoRolEsSoloEspacios_elMapperRecibeDTOConRoleCUSTOMER() {
        userCreateDTO.setRole("   ");
        ArgumentCaptor<UserCreateDTO> captor = ArgumentCaptor.forClass(UserCreateDTO.class);
        when(userRepository.existsByContactEmail(anyString())).thenReturn(false);
        when(serviceUserMapper.toRepositoryUserModel(captor.capture())).thenReturn(repositoryUser);
        when(userRepository.save(repositoryUser)).thenReturn(repositoryUser);
        when(serviceUserMapper.toUserResponseDTO(repositoryUser)).thenReturn(userResponseDTO);

        userService.createUser(userCreateDTO);

        assertThat(captor.getValue().getRole()).isEqualTo("CUSTOMER");
    }

    // --- getUsersByFirstName L96: REMOVE_CONDITIONALS_EQUAL_ELSE elimina || trim().isEmpty() ---
    // Mutante: if (firstName == null) sin isEmpty() → "   " pasa al repo
    // Necesitamos verificar que con "   " el repo NO es llamado y se retorna vacío

    @Test
    void getUsersByFirstName_cuandoNombreEsSoloEspacios_noLlamaRepoYRetornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByFirstName("   ");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByFirstName(any());
    }

    // --- getUsersByLastName L110: mismo patrón ---

    @Test
    void getUsersByLastName_cuandoApellidoEsSoloEspacios_noLlamaRepoYRetornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByLastName("   ");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByLastName(any());
    }

    // --- getUsersByRole L137: mismo patrón ---

    @Test
    void getUsersByRole_cuandoRolEsSoloEspacios_noLlamaRepoYRetornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByRole("   ");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserByRole(any());
    }

    // --- getUsersByFullName L151-152: REMOVE_CONDITIONALS_EQUAL_ELSE ---
    // Mutante elimina || lastName.trim().isEmpty() → "   " en lastName pasa al repo
    // O elimina || firstName.trim().isEmpty() → "   " en firstName pasa al repo

    @Test
    void getUsersByFullName_cuandoApellidoEsSoloEspacios_noLlamaRepoYRetornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByFullName("Juan", "   ");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserFirstNameAndLastName(any(), any());
    }

    @Test
    void getUsersByFullName_cuandoNombreEsSoloEspacios_noLlamaRepoYRetornaVacio() {
        Collection<UserResponseDTO> resultado = userService.getUsersByFullName("   ", "Pérez");

        assertThat(resultado).isEmpty();
        verify(userRepository, never()).findUserFirstNameAndLastName(any(), any());
    }

    // --- updateUserByEmail L168: REMOVE_CONDITIONALS_EQUAL_ELSE elimina || trim().isEmpty() ---
    // Mutante: if (email == null) sin isEmpty() → "   " no lanza IAE, sigue al repo

    @Test
    void updateUserByEmail_cuandoEmailEsSoloEspacios_lanzaIllegalArgumentException() {
        assertThatThrownBy(() -> userService.updateUserByEmail("   ", UserUpdateDTO.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
        verify(userRepository, never()).findUserByContactEmail(any());
    }

    // --- verifyLogin L224: REMOVE_CONDITIONALS_EQUAL_ELSE elimina parte del null check ---
    // Mutante elimina || getContactEmail() == null → email null pasa al repo → otro mensaje
    // Necesitamos verificar el mensaje EXACTO para distinguir los caminos

    @Test
    void verifyLogin_cuandoEmailNulo_retornaMensajeObligatorioYSuccessFalse() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .contactEmail(null)
                .password("password123")
                .build();

        LoginResponseDTO resultado = userService.verifyLogin(request);

        assertThat(resultado.isSuccess()).isFalse();
        assertThat(resultado.getMessage()).isEqualTo("Email y contraseña son obligatorios");
        verify(userRepository, never()).findUserByContactEmail(any());
    }

    // --- verifyLogin L224: mismo mutante pero en || getPassword() == null ---

    @Test
    void verifyLogin_cuandoPasswordNula_retornaMensajeObligatorioYSuccessFalse() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .contactEmail("juan.perez@email.com")
                .password(null)
                .build();

        LoginResponseDTO resultado = userService.verifyLogin(request);

        assertThat(resultado.isSuccess()).isFalse();
        assertThat(resultado.getMessage()).isEqualTo("Email y contraseña son obligatorios");
        verify(userRepository, never()).findUserByContactEmail(any());
    }

    // --- verifyLogin L226: NullReturnValsMutator reemplaza el return por null ---
    // Test que verifica que el objeto retornado NO es nulo cuando hay campos nulos

    @Test
    void verifyLogin_cuandoEmailNulo_retornaObjetoNoNulo() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .contactEmail(null)
                .password("password123")
                .build();

        LoginResponseDTO resultado = userService.verifyLogin(request);

        assertThat(resultado).isNotNull();
    }
}
