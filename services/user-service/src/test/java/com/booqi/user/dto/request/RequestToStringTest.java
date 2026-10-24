package com.booqi.user.dto.request;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

class RequestToStringTest {

    private static final String SECRET = "admin_mel";

    @Test
    void createUserRequest_enmascaraPassword() {
        String text =
                new CreateUserRequest(
                                "Mel",
                                "Admin",
                                LocalDate.of(1995, 4, 12),
                                "631835827",
                                "mel@booqi.com",
                                SECRET,
                                "ADMIN")
                        .toString();

        assertThat(text).doesNotContain(SECRET).contains("password=***").contains("firstName=Mel");
    }

    @Test
    void updateUserRequest_enmascaraPassword() {
        String text =
                new UpdateUserRequest("Mel", null, null, null, "mel@booqi.com", SECRET, null)
                        .toString();

        assertThat(text).doesNotContain(SECRET).contains("password=***").contains("firstName=Mel");
    }

    @Test
    void loginRequest_enmascaraPassword() {
        String text = new LoginRequest("mel@booqi.com", SECRET).toString();

        assertThat(text)
                .doesNotContain(SECRET)
                .contains("password=***")
                .contains("contactEmail=mel@booqi.com");
    }
}
