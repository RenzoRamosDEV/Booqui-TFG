package com.booqi.user.mapper;

import com.booqi.user.dto.request.CreateUserRequest;
import com.booqi.user.dto.request.UpdateUserRequest;
import com.booqi.user.dto.response.UserResponse;
import com.booqi.user.entity.User;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UserMapperTest {

    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 1, 1, 10, 0);
    private static final LocalDateTime UPDATED = LocalDateTime.of(2026, 1, 2, 11, 30);

    private final UserMapper mapper = new UserMapperImpl();

    private User entity() {
        return User.builder()
                .id(7L)
                .firstName("Mel")
                .lastName("Admin")
                .dateOfBirth(LocalDate.of(1995, 4, 12))
                .contactPhone("631835827")
                .contactEmail("mel@booqi.com")
                .password("$2a$10$hash")
                .role(User.Role.ADMIN)
                .createdAt(CREATED)
                .updatedAt(UPDATED)
                .build();
    }

    @Test
    void toResponse_copiaTodosLosCamposYRolComoTexto() {
        UserResponse response = mapper.toResponse(entity());

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.firstName()).isEqualTo("Mel");
        assertThat(response.lastName()).isEqualTo("Admin");
        assertThat(response.dateOfBirth()).isEqualTo(LocalDate.of(1995, 4, 12));
        assertThat(response.contactPhone()).isEqualTo("631835827");
        assertThat(response.contactEmail()).isEqualTo("mel@booqi.com");
        assertThat(response.role()).isEqualTo("ADMIN");
        assertThat(response.createdAt()).isEqualTo(CREATED);
        assertThat(response.updatedAt()).isEqualTo(UPDATED);
    }

    @Test
    void userResponse_noTienePropiedadPassword() {
        assertThat(UserResponse.class.getDeclaredFields())
                .extracting(Field::getName)
                .doesNotContain("password", "idUser");
    }

    @Test
    void toEntity_ignoraIdPasswordRolYAuditoria() {
        CreateUserRequest request = new CreateUserRequest("Nuevo", "Usuario", LocalDate.of(2000, 1, 1), "600000000", "new@booqi.com", "securepass123", "ADMIN");

        User user = mapper.toEntity(request);

        assertThat(user.getFirstName()).isEqualTo("Nuevo");
        assertThat(user.getLastName()).isEqualTo("Usuario");
        assertThat(user.getDateOfBirth()).isEqualTo(LocalDate.of(2000, 1, 1));
        assertThat(user.getContactPhone()).isEqualTo("600000000");
        assertThat(user.getContactEmail()).isEqualTo("new@booqi.com");
        assertThat(user.getId()).isNull();
        assertThat(user.getPassword()).isNull();
        assertThat(user.getRole()).isNull();
        assertThat(user.getCreatedAt()).isNull();
        assertThat(user.getUpdatedAt()).isNull();
    }

    @Test
    void updateEntity_conCamposNulosNoModificaElDestino() {
        User target = entity();

        mapper.updateEntity(new UpdateUserRequest(null, null, null, null, null, null, null), target);

        assertThat(target.getFirstName()).isEqualTo("Mel");
        assertThat(target.getContactEmail()).isEqualTo("mel@booqi.com");
        assertThat(target.getContactPhone()).isEqualTo("631835827");
        assertThat(target.getDateOfBirth()).isEqualTo(LocalDate.of(1995, 4, 12));
    }

    @Test
    void updateEntity_aplicaCamposPresentesSinTocarPasswordNiRol() {
        User target = entity();

        mapper.updateEntity(new UpdateUserRequest("Melanie", null, null, null, null, "otrapassword", "CUSTOMER"), target);

        assertThat(target.getFirstName()).isEqualTo("Melanie");
        assertThat(target.getLastName()).isEqualTo("Admin");
        assertThat(target.getPassword()).isEqualTo("$2a$10$hash");
        assertThat(target.getRole()).isEqualTo(User.Role.ADMIN);
        assertThat(target.getId()).isEqualTo(7L);
        assertThat(target.getCreatedAt()).isEqualTo(CREATED);
    }

    @Test
    void toResponseList_mapeaCadaElemento() {
        List<UserResponse> responses = mapper.toResponseList(List.of(entity(), entity()));

        assertThat(responses).hasSize(2).extracting(UserResponse::id).containsExactly(7L, 7L);
    }

    @Test
    void toResponseList_listaVacia() {
        assertThat(mapper.toResponseList(List.of())).isEmpty();
    }
}
