package com.booqi.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.booqi.user.dto.request.CreateUserRequest;
import com.booqi.user.dto.request.LoginRequest;
import com.booqi.user.dto.request.UpdateUserRequest;
import com.booqi.user.dto.request.UserFilter;
import com.booqi.user.dto.response.UserResponse;
import com.booqi.user.exception.BusinessException;
import com.booqi.user.exception.ConflictException;
import com.booqi.user.exception.InvalidCredentialsException;
import com.booqi.user.exception.InvalidFilterException;
import com.booqi.user.exception.ResourceNotFoundException;
import com.booqi.user.service.UserService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

@WebMvcTest(UserController.class)
@ActiveProfiles("test")
class UserControllerTest {

    private static final String USERS = "/api/v1/users";
    private static final MediaType PROBLEM = MediaType.APPLICATION_PROBLEM_JSON;

    private static final String VALID_CREATE =
            """
            {
              "firstName": "Juan",
              "lastName": "Pérez",
              "dateOfBirth": "1990-05-15",
              "contactPhone": "631835827",
              "contactEmail": "new@booqi.com",
              "password": "securepass123"
            }
            """;

    private static final String VALID_LOGIN =
            """
            {"contactEmail": "mel@booqi.com", "password": "admin_mel"}
            """;

    private final MockMvc mockMvc;

    @MockitoBean private UserService userService;

    UserControllerTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
    }

    private static UserResponse user(long id, String email, String role) {
        return new UserResponse(
                id,
                "Juan",
                "Pérez",
                LocalDate.of(1990, 5, 15),
                "631835827",
                email,
                role,
                LocalDateTime.of(2026, 1, 1, 0, 0),
                LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    private static String quote(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private static String createBody(
            String firstName,
            String lastName,
            String dateOfBirth,
            String contactPhone,
            String contactEmail,
            String password,
            String role) {
        return """
                {"firstName": %s, "lastName": %s, "dateOfBirth": %s, "contactPhone": %s,
                 "contactEmail": %s, "password": %s, "role": %s}
                """
                .formatted(
                        quote(firstName),
                        quote(lastName),
                        quote(dateOfBirth),
                        quote(contactPhone),
                        quote(contactEmail),
                        quote(password),
                        quote(role));
    }

    // POST /api/v1/users

    @Test
    void create_retorna201ConLocationYSinPassword() throws Exception {
        when(userService.create(any(CreateUserRequest.class)))
                .thenReturn(user(5, "new@booqi.com", "CUSTOMER"));

        mockMvc.perform(post(USERS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/users/5"))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.idUser").doesNotExist());
    }

    @Test
    void create_conEmailInvalido_retorna400ConErrores() throws Exception {
        mockMvc.perform(
                        post(USERS)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                "Juan",
                                                "Pérez",
                                                "1990-05-15",
                                                null,
                                                "not-an-email",
                                                "securepass123",
                                                null)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Validation failed"))
                .andExpect(jsonPath("$.instance").value("/api/v1/users"))
                .andExpect(jsonPath("$.errors[0].field").value("contactEmail"))
                .andExpect(jsonPath("$.errors[0].message").value("El email debe ser válido"));
        verifyNoInteractions(userService);
    }

    @Test
    void create_sinPassword_retorna400ConErrorDePassword() throws Exception {
        mockMvc.perform(
                        post(USERS)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        createBody(
                                                "Juan",
                                                "Pérez",
                                                "1990-05-15",
                                                null,
                                                "new@booqi.com",
                                                null,
                                                null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("password")));
    }

    @Test
    void create_conJsonMalformado_retorna400Problem() throws Exception {
        mockMvc.perform(
                        post(USERS)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"firstName\": "))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.instance").value("/api/v1/users"));
    }

    @Test
    void create_conEmailDuplicado_retorna409() throws Exception {
        when(userService.create(any()))
                .thenThrow(
                        new ConflictException(
                                "User with contactEmail new@booqi.com already exists"));

        mockMvc.perform(post(USERS).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(
                        content()
                                .json(
                                        """
                        {"type": "about:blank", "title": "Conflict", "status": 409,
                         "detail": "User with contactEmail new@booqi.com already exists",
                         "instance": "/api/v1/users"}
                        """,
                                        JsonCompareMode.STRICT));
    }

    static Stream<Arguments> createBoundaries() {
        String past = LocalDate.now().minusDays(1).toString();
        String today = LocalDate.now().toString();
        String future = LocalDate.now().plusYears(1).toString();
        return Stream.of(
                Arguments.of(
                        "firstName 1",
                        createBody(
                                "A", "Pérez", "1990-05-15", null, "a@b.com", "securepass123", null),
                        400),
                Arguments.of(
                        "firstName 2",
                        createBody(
                                "Jo",
                                "Pérez",
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                null),
                        201),
                Arguments.of(
                        "firstName 50",
                        createBody(
                                "A".repeat(50),
                                "Pérez",
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                null),
                        201),
                Arguments.of(
                        "firstName 51",
                        createBody(
                                "A".repeat(51),
                                "Pérez",
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                null),
                        400),
                Arguments.of(
                        "firstName blank",
                        createBody(
                                "", "Pérez", "1990-05-15", null, "a@b.com", "securepass123", null),
                        400),
                Arguments.of(
                        "lastName 1",
                        createBody(
                                "Juan", "X", "1990-05-15", null, "a@b.com", "securepass123", null),
                        400),
                Arguments.of(
                        "lastName 2",
                        createBody(
                                "Juan", "Li", "1990-05-15", null, "a@b.com", "securepass123", null),
                        201),
                Arguments.of(
                        "lastName 50",
                        createBody(
                                "Juan",
                                "B".repeat(50),
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                null),
                        201),
                Arguments.of(
                        "lastName 51",
                        createBody(
                                "Juan",
                                "B".repeat(51),
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                null),
                        400),
                Arguments.of(
                        "password 7",
                        createBody("Juan", "Pérez", "1990-05-15", null, "a@b.com", "1234567", null),
                        400),
                Arguments.of(
                        "password 8",
                        createBody(
                                "Juan", "Pérez", "1990-05-15", null, "a@b.com", "12345678", null),
                        201),
                Arguments.of(
                        "phone 8",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                "12345678",
                                "a@b.com",
                                "securepass123",
                                null),
                        400),
                Arguments.of(
                        "phone 9",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                "123456789",
                                "a@b.com",
                                "securepass123",
                                null),
                        201),
                Arguments.of(
                        "phone 15",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                "123456789012345",
                                "a@b.com",
                                "securepass123",
                                null),
                        201),
                Arguments.of(
                        "phone 16",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                "1234567890123456",
                                "a@b.com",
                                "securepass123",
                                null),
                        400),
                Arguments.of(
                        "phone +7",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                "+1234567",
                                "a@b.com",
                                "securepass123",
                                null),
                        400),
                Arguments.of(
                        "phone +9",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                "+123456789",
                                "a@b.com",
                                "securepass123",
                                null),
                        201),
                Arguments.of(
                        "phone letters",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                "63183ABCD",
                                "a@b.com",
                                "securepass123",
                                null),
                        400),
                Arguments.of(
                        "dob today",
                        createBody("Juan", "Pérez", today, null, "a@b.com", "securepass123", null),
                        400),
                Arguments.of(
                        "dob yesterday",
                        createBody("Juan", "Pérez", past, null, "a@b.com", "securepass123", null),
                        201),
                Arguments.of(
                        "dob future",
                        createBody("Juan", "Pérez", future, null, "a@b.com", "securepass123", null),
                        400),
                Arguments.of(
                        "dob missing",
                        createBody("Juan", "Pérez", null, null, "a@b.com", "securepass123", null),
                        400),
                Arguments.of(
                        "role ADMIN",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                "ADMIN"),
                        201),
                Arguments.of(
                        "role CUSTOMER",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                "CUSTOMER"),
                        201),
                Arguments.of(
                        "role invalid",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                "SUPERADMIN"),
                        400),
                Arguments.of(
                        "role lowercase",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                null,
                                "a@b.com",
                                "securepass123",
                                "admin"),
                        400),
                Arguments.of(
                        "email no at",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                null,
                                "juanemail.com",
                                "securepass123",
                                null),
                        400),
                Arguments.of(
                        "email no domain",
                        createBody(
                                "Juan",
                                "Pérez",
                                "1990-05-15",
                                null,
                                "juan@",
                                "securepass123",
                                null),
                        400));
    }

    @ParameterizedTest(name = "{0} -> {2}")
    @MethodSource("createBoundaries")
    void create_validacionDeLimites(String caseName, String body, int expectedStatus)
            throws Exception {
        when(userService.create(any())).thenReturn(user(5, "a@b.com", "CUSTOMER"));

        mockMvc.perform(post(USERS).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is(expectedStatus));
    }

    // GET /api/v1/users

    @Test
    void list_sinParametros_pasaFiltroVacioAlServicio() throws Exception {
        when(userService.findAll(any(UserFilter.class)))
                .thenReturn(List.of(user(1, "mel@booqi.com", "ADMIN")));

        mockMvc.perform(get(USERS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].password").doesNotExist());

        ArgumentCaptor<UserFilter> captor = ArgumentCaptor.forClass(UserFilter.class);
        verify(userService).findAll(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new UserFilter(null, null, null, null, null));
    }

    @Test
    void list_conParametros_losVinculaEnUserFilter() throws Exception {
        when(userService.findAll(any(UserFilter.class))).thenReturn(List.of());

        mockMvc.perform(
                        get(USERS)
                                .param("contactEmail", "mel@booqi.com")
                                .param("contactPhone", "631835827")
                                .param("role", "admin")
                                .param("firstName", "Mel")
                                .param("lastName", "Admin"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        ArgumentCaptor<UserFilter> captor = ArgumentCaptor.forClass(UserFilter.class);
        verify(userService).findAll(captor.capture());
        assertThat(captor.getValue())
                .isEqualTo(new UserFilter("mel@booqi.com", "631835827", "admin", "Mel", "Admin"));
    }

    @Test
    void list_conFiltroInvalido_retorna400Problem() throws Exception {
        when(userService.findAll(any(UserFilter.class)))
                .thenThrow(
                        new InvalidFilterException(
                                "Only one filter may be used at a time (firstName and lastName may be combined)"));

        mockMvc.perform(get(USERS).param("role", "ADMIN").param("contactEmail", "mel@booqi.com"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(
                        content()
                                .json(
                                        """
                        {"type": "about:blank", "title": "Bad Request", "status": 400,
                         "detail": "Only one filter may be used at a time (firstName and lastName may be combined)",
                         "instance": "/api/v1/users"}
                        """,
                                        JsonCompareMode.STRICT));
    }

    @Test
    void list_errorInesperado_retorna500Generico() throws Exception {
        when(userService.findAll(any(UserFilter.class)))
                .thenThrow(new RuntimeException("boom secret"));

        mockMvc.perform(get(USERS))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.instance").value("/api/v1/users"))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(jsonPath("$.exception").doesNotExist())
                .andExpect(content().string(not(containsString("boom secret"))))
                .andExpect(content().string(not(containsString("RuntimeException"))));
    }

    // GET /api/v1/users/{id}

    @Test
    void findById_retorna200() throws Exception {
        when(userService.findById(1L)).thenReturn(user(1, "mel@booqi.com", "ADMIN"));

        mockMvc.perform(get(USERS + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.contactEmail").value("mel@booqi.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void findById_inexistente_retorna404ProblemExacto() throws Exception {
        when(userService.findById(99L))
                .thenThrow(new ResourceNotFoundException("User with id 99 not found"));

        mockMvc.perform(get(USERS + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(
                        content()
                                .json(
                                        """
                        {"type": "about:blank", "title": "Not Found", "status": 404,
                         "detail": "User with id 99 not found", "instance": "/api/v1/users/99"}
                        """,
                                        JsonCompareMode.STRICT));
    }

    @Test
    void findById_noNumerico_retorna400Problem() throws Exception {
        mockMvc.perform(get(USERS + "/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.instance").value("/api/v1/users/abc"));
        verifyNoInteractions(userService);
    }

    @Test
    void businessException_retorna422() throws Exception {
        when(userService.findById(3L)).thenThrow(new BusinessException("Rule broken"));

        mockMvc.perform(get(USERS + "/3"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.detail").value("Rule broken"))
                .andExpect(jsonPath("$.instance").value("/api/v1/users/3"));
    }

    @Test
    void metodoNoSoportado_retorna405AboutBlank() throws Exception {
        mockMvc.perform(patch(USERS))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.instance").value(USERS));
        verifyNoInteractions(userService);
    }

    @Test
    void findById_noNumerico_noExponeTiposJava() throws Exception {
        mockMvc.perform(get(USERS + "/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(content().string(not(containsString("java."))))
                .andExpect(content().string(not(containsString("NumberFormatException"))));
    }

    @Test
    void rutasLegadas_retornan404() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isNotFound());
        mockMvc.perform(get(USERS + "/exists/email/mel@booqi.com"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM));
    }

    // PUT /api/v1/users/{id}

    @Test
    void update_retorna200() throws Exception {
        when(userService.update(eq(3L), any(UpdateUserRequest.class)))
                .thenReturn(user(3, "andy@booqi.com", "CUSTOMER"));

        mockMvc.perform(
                        put(USERS + "/3")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                        {"firstName": "Andy"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.password").doesNotExist());

        ArgumentCaptor<UpdateUserRequest> captor = ArgumentCaptor.forClass(UpdateUserRequest.class);
        verify(userService).update(eq(3L), captor.capture());
        assertThat(captor.getValue())
                .isEqualTo(new UpdateUserRequest("Andy", null, null, null, null, null, null));
    }

    @Test
    void update_inexistente_retorna404() throws Exception {
        when(userService.update(eq(99L), any()))
                .thenThrow(new ResourceNotFoundException("User with id 99 not found"));

        mockMvc.perform(
                        put(USERS + "/99")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                        {"firstName": "Andy"}
                        """))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.instance").value("/api/v1/users/99"));
    }

    @Test
    void update_emailDuplicado_retorna409() throws Exception {
        when(userService.update(eq(2L), any()))
                .thenThrow(
                        new ConflictException(
                                "User with contactEmail mel@booqi.com already exists"));

        mockMvc.perform(
                        put(USERS + "/2")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                        {"contactEmail": "mel@booqi.com"}
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    static Stream<Arguments> updateBoundaries() {
        return Stream.of(
                Arguments.of("{\"firstName\": \"X\"}", 400),
                Arguments.of("{\"firstName\": \"Jo\"}", 200),
                Arguments.of("{\"firstName\": \"" + "A".repeat(51) + "\"}", 400),
                Arguments.of("{\"password\": \"1234567\"}", 400),
                Arguments.of("{\"password\": \"12345678\"}", 200),
                Arguments.of("{\"password\": \"\"}", 400),
                Arguments.of("{\"dateOfBirth\": \"" + LocalDate.now() + "\"}", 400),
                Arguments.of("{\"dateOfBirth\": \"" + LocalDate.now().minusDays(1) + "\"}", 200),
                Arguments.of("{\"role\": \"MODERADOR\"}", 400),
                Arguments.of("{\"contactPhone\": \"12345678\"}", 400),
                Arguments.of("{\"contactPhone\": \"123456789\"}", 200),
                Arguments.of("{\"contactPhone\": \"1234567890123456\"}", 400),
                Arguments.of("{\"contactEmail\": \"no-es-email\"}", 400));
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @MethodSource("updateBoundaries")
    void update_validacionDeLimites(String body, int expectedStatus) throws Exception {
        when(userService.update(eq(1L), any())).thenReturn(user(1, "mel@booqi.com", "ADMIN"));

        mockMvc.perform(put(USERS + "/1").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is(expectedStatus));
    }

    // DELETE /api/v1/users/{id}

    @Test
    void delete_retorna204SinCuerpo() throws Exception {
        mockMvc.perform(delete(USERS + "/6"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
        verify(userService).delete(6L);
    }

    @Test
    void delete_inexistente_retorna404() throws Exception {
        org.mockito.Mockito.doThrow(new ResourceNotFoundException("User with id 99 not found"))
                .when(userService)
                .delete(99L);

        mockMvc.perform(delete(USERS + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("User with id 99 not found"));
    }

    // POST /api/v1/users/login

    @Test
    void login_correcto_retorna200ConUsuario() throws Exception {
        when(userService.login(new LoginRequest("mel@booqi.com", "admin_mel")))
                .thenReturn(user(1, "mel@booqi.com", "ADMIN"));

        mockMvc.perform(
                        post(USERS + "/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(VALID_LOGIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.contactEmail").value("mel@booqi.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.success").doesNotExist());
    }

    @Test
    void login_credencialesInvalidas_retorna401() throws Exception {
        when(userService.login(any()))
                .thenThrow(new InvalidCredentialsException("Invalid email or password"));

        mockMvc.perform(
                        post(USERS + "/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(VALID_LOGIN))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(
                        content()
                                .json(
                                        """
                        {"type": "about:blank", "title": "Unauthorized", "status": 401,
                         "detail": "Invalid email or password", "instance": "/api/v1/users/login"}
                        """,
                                        JsonCompareMode.STRICT));
    }

    @Test
    void login_sinPassword_retorna400ConErrorDePassword() throws Exception {
        mockMvc.perform(
                        post(USERS + "/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                        {"contactEmail": "mel@booqi.com"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(PROBLEM))
                .andExpect(jsonPath("$.errors[*].field", hasItem("password")));
        verifyNoInteractions(userService);
    }

    @Test
    void login_conEmailMalformado_retorna400() throws Exception {
        mockMvc.perform(
                        post(USERS + "/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                        {"contactEmail": "no-es-email", "password": "admin_mel"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("contactEmail")));
    }
}
