package org.service_payment.payment.client;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.springframework.http.HttpMethod.PATCH;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class EventServiceClientTest {

    @Test
    void decrementStock_llamaAlPatchDeLaApiV1YAceptaCuerpo() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        EventServiceClient client = new EventServiceClient(restTemplate, "http://event-service:8081/api/v1/events");
        server.expect(requestTo("http://event-service:8081/api/v1/events/3/stock?quantity=2"))
                .andExpect(method(PATCH))
                .andRespond(withSuccess("""
                        {"id":3,"title":"Obra de Teatro: La Espera","description":"Drama","availableTickets":2,
                         "location":"Teatro Gran Vía, Madrid","startDate":"2026-03-20T20:30:00","endDate":"2026-03-20T22:30:00",
                         "organizer":"Producciones Escénicas S.L.","price":40.0,"category":"Cultura",
                         "contactEmail":"tickets@teatro.com","contactPhone":"910000003","imageUrl":null,
                         "createdAt":"2026-01-01T00:00:00","updatedAt":"2026-01-01T00:00:00"}
                        """, MediaType.APPLICATION_JSON));

        assertThatCode(() -> client.decrementStock(3L, 2)).doesNotThrowAnyException();
        server.verify();
    }
}
