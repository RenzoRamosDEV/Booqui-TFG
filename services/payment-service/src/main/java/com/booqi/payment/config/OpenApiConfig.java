package com.booqi.payment.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Booqi Payment Service API")
                        .version("v1")
                        .description("Simulated processing and lookup of Booqi payments.")
                        .contact(new Contact()
                                .name("Renzo Iván Ramos de los Ríos & Melanie Gabriela Cárdenas Hidalgo"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")));
    }
}
