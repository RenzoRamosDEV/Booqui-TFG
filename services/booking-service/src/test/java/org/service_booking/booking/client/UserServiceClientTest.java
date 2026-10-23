package org.service_booking.booking.client;

import org.junit.jupiter.api.Test;
import org.service_booking.booking.service.model.UserResponseDTO;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpMethod.GET;

class UserServiceClientTest {

    @Test
    void getUserById_leeElIdDeLaApiV1() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        UserServiceClient client = new UserServiceClient(restTemplate, "http://user-service:8080/api/v1/users");
        server.expect(requestTo("http://user-service:8080/api/v1/users/7"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {"id":7,"firstName":"Mel","lastName":"Admin","contactEmail":"mel@booqi.com","role":"ADMIN",
                         "createdAt":"2026-01-01T00:00:00","updatedAt":"2026-01-01T00:00:00"}
                        """, MediaType.APPLICATION_JSON));

        UserResponseDTO user = client.getUserById(7L);

        assertThat(user.getIdUser()).isEqualTo(7L);
        assertThat(user.getContactEmail()).isEqualTo("mel@booqi.com");
        server.verify();
    }
}
