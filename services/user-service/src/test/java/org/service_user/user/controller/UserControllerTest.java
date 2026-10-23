package org.service_user.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.service_user.user.service.UserService;
import org.service_user.user.service.model.*;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UserResponseDTO userResponseDTO;
    private UserCreateDTO userCreateDTO;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
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
    // POST /api/users - createUser
    // -------------------------------------------------------------------------

    @Test
    void createUser_cuandoDatosValidos_retorna201() throws Exception {
        when(userService.createUser(any(UserCreateDTO.class))).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idUser").value(1L))
                .andExpect(jsonPath("$.firstName").value("Juan"))
                .andExpect(jsonPath("$.contactEmail").value("juan.perez@email.com"));
    }

    @Test
    void createUser_cuandoEmailInvalido_retorna400() throws Exception {
        userCreateDTO.setContactEmail("no-es-un-email");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoNombreVacio_retorna400() throws Exception {
        userCreateDTO.setFirstName("");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoPasswordCorta_retorna400() throws Exception {
        userCreateDTO.setPassword("corta");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // GET /api/users - getAllUsers
    // -------------------------------------------------------------------------

    @Test
    void getAllUsers_retorna200ConListaDeUsuarios() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(userResponseDTO));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idUser").value(1L))
                .andExpect(jsonPath("$[0].firstName").value("Juan"));
    }

    @Test
    void getAllUsers_cuandoNoHayUsuarios_retorna200ConListaVacia() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -------------------------------------------------------------------------
    // GET /api/users/{id} - getUserById
    // -------------------------------------------------------------------------

    @Test
    void getUserById_cuandoExiste_retorna200() throws Exception {
        when(userService.getUserById(1L)).thenReturn(Optional.of(userResponseDTO));

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idUser").value(1L));
    }

    @Test
    void getUserById_cuandoNoExiste_retorna404() throws Exception {
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/99"))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // GET /api/users/email/{email} - getUserByContactEmail
    // -------------------------------------------------------------------------

    @Test
    void getUserByContactEmail_cuandoExiste_retorna200() throws Exception {
        when(userService.getUserByContactEmail("juan.perez@email.com")).thenReturn(Optional.of(userResponseDTO));

        mockMvc.perform(get("/api/users/email/juan.perez@email.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactEmail").value("juan.perez@email.com"));
    }

    @Test
    void getUserByContactEmail_cuandoNoExiste_retorna404() throws Exception {
        when(userService.getUserByContactEmail("otro@email.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/email/otro@email.com"))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // GET /api/users/search/firstname - getUsersByFirstName
    // -------------------------------------------------------------------------

    @Test
    void getUsersByFirstName_retorna200ConUsuarios() throws Exception {
        when(userService.getUsersByFirstName("Juan")).thenReturn(List.of(userResponseDTO));

        mockMvc.perform(get("/api/users/search/firstname").param("name", "Juan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].firstName").value("Juan"));
    }

    @Test
    void getUsersByFirstName_cuandoNoHayResultados_retorna200ConListaVacia() throws Exception {
        when(userService.getUsersByFirstName("Inexistente")).thenReturn(List.of());

        mockMvc.perform(get("/api/users/search/firstname").param("name", "Inexistente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -------------------------------------------------------------------------
    // GET /api/users/search/lastname - getUsersByLastName
    // -------------------------------------------------------------------------

    @Test
    void getUsersByLastName_retorna200ConUsuarios() throws Exception {
        when(userService.getUsersByLastName("Pérez")).thenReturn(List.of(userResponseDTO));

        mockMvc.perform(get("/api/users/search/lastname").param("name", "Pérez"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].lastName").value("Pérez"));
    }

    @Test
    void getUsersByLastName_cuandoNoHayResultados_retorna200ConListaVacia() throws Exception {
        when(userService.getUsersByLastName("Inexistente")).thenReturn(List.of());

        mockMvc.perform(get("/api/users/search/lastname").param("name", "Inexistente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -------------------------------------------------------------------------
    // GET /api/users/search/fullname - getUsersByFullName
    // -------------------------------------------------------------------------

    @Test
    void getUsersByFullName_retorna200ConUsuarios() throws Exception {
        when(userService.getUsersByFullName("Juan", "Pérez")).thenReturn(List.of(userResponseDTO));

        mockMvc.perform(get("/api/users/search/fullname")
                        .param("firstName", "Juan")
                        .param("lastName", "Pérez"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].firstName").value("Juan"))
                .andExpect(jsonPath("$[0].lastName").value("Pérez"));
    }

    @Test
    void getUsersByFullName_cuandoNoHayResultados_retorna200ConListaVacia() throws Exception {
        when(userService.getUsersByFullName("Otro", "Apellido")).thenReturn(List.of());

        mockMvc.perform(get("/api/users/search/fullname")
                        .param("firstName", "Otro")
                        .param("lastName", "Apellido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -------------------------------------------------------------------------
    // GET /api/users/phone/{phoneNumber} - getUserByContactPhone
    // -------------------------------------------------------------------------

    @Test
    void getUserByContactPhone_cuandoExiste_retorna200() throws Exception {
        when(userService.getUserByContactPhone("631835827")).thenReturn(Optional.of(userResponseDTO));

        mockMvc.perform(get("/api/users/phone/631835827"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactPhone").value("631835827"));
    }

    @Test
    void getUserByContactPhone_cuandoNoExiste_retorna404() throws Exception {
        when(userService.getUserByContactPhone("000000000")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/phone/000000000"))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // GET /api/users/role/{role} - getUsersByRole
    // -------------------------------------------------------------------------

    @Test
    void getUsersByRole_retorna200ConUsuarios() throws Exception {
        when(userService.getUsersByRole("CUSTOMER")).thenReturn(List.of(userResponseDTO));

        mockMvc.perform(get("/api/users/role/CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].role").value("CUSTOMER"));
    }

    @Test
    void getUsersByRole_cuandoNoHayUsuarios_retorna200ConListaVacia() throws Exception {
        when(userService.getUsersByRole("ADMIN")).thenReturn(List.of());

        mockMvc.perform(get("/api/users/role/ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -------------------------------------------------------------------------
    // PUT /api/users/email/{email} - updateUser
    // -------------------------------------------------------------------------

    @Test
    void updateUser_cuandoDatosValidos_retorna200() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder()
                .firstName("Carlos")
                .build();

        when(userService.updateUserByEmail(eq("juan.perez@email.com"), any(UserUpdateDTO.class)))
                .thenReturn(userResponseDTO);

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idUser").value(1L));
    }

    @Test
    void updateUser_cuandoEmailInvalido_retorna400() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder()
                .contactEmail("no-es-email")
                .build();

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/users/email/{email} - deleteUser
    // -------------------------------------------------------------------------

    @Test
    void deleteUser_cuandoExiste_retorna204() throws Exception {
        doNothing().when(userService).deleteUserByEmail("juan.perez@email.com");

        mockMvc.perform(delete("/api/users/email/juan.perez@email.com"))
                .andExpect(status().isNoContent());

        verify(userService).deleteUserByEmail("juan.perez@email.com");
    }

    // -------------------------------------------------------------------------
    // GET /api/users/exists/email/{email} - existsByContactEmail
    // -------------------------------------------------------------------------

    @Test
    void existsByContactEmail_cuandoExiste_retorna200ConTrue() throws Exception {
        when(userService.existsByContactEmail("juan.perez@email.com")).thenReturn(true);

        mockMvc.perform(get("/api/users/exists/email/juan.perez@email.com"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void existsByContactEmail_cuandoNoExiste_retorna200ConFalse() throws Exception {
        when(userService.existsByContactEmail("otro@email.com")).thenReturn(false);

        mockMvc.perform(get("/api/users/exists/email/otro@email.com"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }

    // -------------------------------------------------------------------------
    // GET /api/users/health - healthCheck
    // -------------------------------------------------------------------------

    @Test
    void healthCheck_retorna200ConMensaje() throws Exception {
        mockMvc.perform(get("/api/users/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("User Service está activo"));
    }

    // -------------------------------------------------------------------------
    // POST /api/users/login - login
    // -------------------------------------------------------------------------

    @Test
    void login_cuandoCredencialesCorrectas_retorna200() throws Exception {
        LoginRequestDTO loginRequest = LoginRequestDTO.builder()
                .contactEmail("juan.perez@email.com")
                .password("securepass123")
                .build();

        LoginResponseDTO loginResponse = LoginResponseDTO.builder()
                .success(true)
                .message("Login exitoso")
                .user(userResponseDTO)
                .build();

        when(userService.verifyLogin(any(LoginRequestDTO.class))).thenReturn(loginResponse);

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login exitoso"))
                .andExpect(jsonPath("$.user.idUser").value(1L));
    }

    @Test
    void login_cuandoCredencialesIncorrectas_retorna401() throws Exception {
        LoginRequestDTO loginRequest = LoginRequestDTO.builder()
                .contactEmail("juan.perez@email.com")
                .password("wrongpassword")
                .build();

        LoginResponseDTO loginResponse = LoginResponseDTO.builder()
                .success(false)
                .message("Email o contraseña incorrectos")
                .build();

        when(userService.verifyLogin(any(LoginRequestDTO.class))).thenReturn(loginResponse);

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void login_cuandoEmailInvalido_retorna400() throws Exception {
        LoginRequestDTO loginRequest = LoginRequestDTO.builder()
                .contactEmail("no-es-email")
                .password("securepass123")
                .build();

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_cuandoPasswordVacia_retorna400() throws Exception {
        LoginRequestDTO loginRequest = LoginRequestDTO.builder()
                .contactEmail("juan.perez@email.com")
                .password("")
                .build();

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // VALORES LÍMITE Y CLASES DE EQUIVALENCIA - createUser
    // =========================================================================

    // --- firstName: min=2, max=50 ---

    @Test
    void createUser_cuandoNombreTiene1Caracter_limiteInferiorInvalido_retorna400() throws Exception {
        userCreateDTO.setFirstName("A");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoNombreTiene2Caracteres_limiteInferiorValido_retorna201() throws Exception {
        userCreateDTO.setFirstName("Jo");
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoNombreTiene50Caracteres_limiteSuperiorValido_retorna201() throws Exception {
        userCreateDTO.setFirstName("A".repeat(50));
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoNombreTiene51Caracteres_limiteSuperiorInvalido_retorna400() throws Exception {
        userCreateDTO.setFirstName("A".repeat(51));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    // --- lastName: min=2, max=50 ---

    @Test
    void createUser_cuandoApellidoTiene1Caracter_limiteInferiorInvalido_retorna400() throws Exception {
        userCreateDTO.setLastName("X");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoApellidoTiene2Caracteres_limiteInferiorValido_retorna201() throws Exception {
        userCreateDTO.setLastName("Li");
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoApellidoTiene50Caracteres_limiteSuperiorValido_retorna201() throws Exception {
        userCreateDTO.setLastName("B".repeat(50));
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoApellidoTiene51Caracteres_limiteSuperiorInvalido_retorna400() throws Exception {
        userCreateDTO.setLastName("B".repeat(51));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    // --- password: min=8 ---

    @Test
    void createUser_cuandoPasswordTiene7Caracteres_limiteInferiorInvalido_retorna400() throws Exception {
        userCreateDTO.setPassword("1234567");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoPasswordTiene8Caracteres_limiteInferiorValido_retorna201() throws Exception {
        userCreateDTO.setPassword("12345678");
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    // --- contactPhone: patrón ^\\+?[0-9]{9,15}$ ---

    @Test
    void createUser_cuandoTelefonoTiene8Digitos_limiteInferiorInvalido_retorna400() throws Exception {
        userCreateDTO.setContactPhone("12345678");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoTelefonoTiene9Digitos_limiteInferiorValido_retorna201() throws Exception {
        userCreateDTO.setContactPhone("123456789");
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoTelefonoTiene15Digitos_limiteSuperiorValido_retorna201() throws Exception {
        userCreateDTO.setContactPhone("123456789012345");
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoTelefonoTiene16Digitos_limiteSuperiorInvalido_retorna400() throws Exception {
        userCreateDTO.setContactPhone("1234567890123456");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoTelefonoConPrefijoPlusSinDigitosInsuficientes_retorna400() throws Exception {
        userCreateDTO.setContactPhone("+1234567");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoTelefonoConPrefijoPlus9Digitos_retorna201() throws Exception {
        userCreateDTO.setContactPhone("+123456789");
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoTelefonoConLetras_clasesInvalida_retorna400() throws Exception {
        userCreateDTO.setContactPhone("63183ABCD");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    // --- dateOfBirth: @Past (debe ser fecha pasada) ---

    @Test
    void createUser_cuandoFechaNacimientoEsHoy_limiteInvalido_retorna400() throws Exception {
        userCreateDTO.setDateOfBirth(LocalDate.now());

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoFechaNacimientoEsAyer_limiteValido_retorna201() throws Exception {
        userCreateDTO.setDateOfBirth(LocalDate.now().minusDays(1));
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoFechaNacimientoEsFutura_claseInvalida_retorna400() throws Exception {
        userCreateDTO.setDateOfBirth(LocalDate.now().plusYears(1));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    // --- role: ADMIN | CUSTOMER ---

    @Test
    void createUser_cuandoRolAdmin_claseValida_retorna201() throws Exception {
        userCreateDTO.setRole("ADMIN");
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoRolCustomer_claseValida_retorna201() throws Exception {
        userCreateDTO.setRole("CUSTOMER");
        when(userService.createUser(any())).thenReturn(userResponseDTO);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isCreated());
    }

    @Test
    void createUser_cuandoRolInvalido_claseInvalida_retorna400() throws Exception {
        userCreateDTO.setRole("SUPERADMIN");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoRolEnMinusculas_claseInvalida_retorna400() throws Exception {
        userCreateDTO.setRole("admin");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    // --- email: clases de equivalencia ---

    @Test
    void createUser_cuandoEmailSinArroba_claseInvalida_retorna400() throws Exception {
        userCreateDTO.setContactEmail("juanemail.com");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_cuandoEmailSinDominio_claseInvalida_retorna400() throws Exception {
        userCreateDTO.setContactEmail("juan@");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreateDTO)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // VALORES LÍMITE Y CLASES DE EQUIVALENCIA - updateUser
    // =========================================================================

    // --- firstName: min=2, max=50 ---

    @Test
    void updateUser_cuandoNombreTiene1Caracter_limiteInferiorInvalido_retorna400() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().firstName("X").build();

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateUser_cuandoNombreTiene2Caracteres_limiteInferiorValido_retorna200() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().firstName("Jo").build();
        when(userService.updateUserByEmail(any(), any())).thenReturn(userResponseDTO);

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk());
    }

    @Test
    void updateUser_cuandoNombreTiene51Caracteres_limiteSuperiorInvalido_retorna400() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().firstName("A".repeat(51)).build();

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    // --- password: min=8 ---

    @Test
    void updateUser_cuandoPasswordTiene7Caracteres_limiteInferiorInvalido_retorna400() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().password("1234567").build();

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateUser_cuandoPasswordTiene8Caracteres_limiteInferiorValido_retorna200() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().password("12345678").build();
        when(userService.updateUserByEmail(any(), any())).thenReturn(userResponseDTO);

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk());
    }

    // --- dateOfBirth en update: @Past ---

    @Test
    void updateUser_cuandoFechaNacimientoEsHoy_limiteInvalido_retorna400() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().dateOfBirth(LocalDate.now()).build();

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateUser_cuandoFechaNacimientoEsAyer_limiteValido_retorna200() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().dateOfBirth(LocalDate.now().minusDays(1)).build();
        when(userService.updateUserByEmail(any(), any())).thenReturn(userResponseDTO);

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk());
    }

    // --- role en update ---

    @Test
    void updateUser_cuandoRolInvalido_claseInvalida_retorna400() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().role("MODERADOR").build();

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    // --- telefono en update ---

    @Test
    void updateUser_cuandoTelefonoTiene8Digitos_limiteInferiorInvalido_retorna400() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().contactPhone("12345678").build();

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateUser_cuandoTelefonoTiene9Digitos_limiteInferiorValido_retorna200() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().contactPhone("123456789").build();
        when(userService.updateUserByEmail(any(), any())).thenReturn(userResponseDTO);

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk());
    }

    @Test
    void updateUser_cuandoTelefonoTiene16Digitos_limiteSuperiorInvalido_retorna400() throws Exception {
        UserUpdateDTO updateDTO = UserUpdateDTO.builder().contactPhone("1234567890123456").build();

        mockMvc.perform(put("/api/users/email/juan.perez@email.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest());
    }
}
