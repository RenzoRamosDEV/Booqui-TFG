package com.booqi.event.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String DESCRIPTION =
            "Creation, lookup, filtering, update, deletion and ticket-stock management of Booqi events.";
    private static final String AUTHORS = "Renzo Iván Ramos de los Ríos & Melanie Gabriela Cárdenas Hidalgo";

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Booqi Event Service API")
                        .version("v1")
                        .description(DESCRIPTION)
                        .contact(new Contact()
                                .name(AUTHORS))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")));
    }
}
