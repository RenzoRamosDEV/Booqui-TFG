package com.booqi.payment.client;

import com.booqi.payment.exception.BusinessException;
import com.booqi.payment.exception.RemoteServiceException;
import com.booqi.payment.exception.ResourceNotFoundException;

import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.RestClient;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;

public class RemoteErrorHandler implements RestClient.ResponseSpec.ErrorHandler {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final String target;

    public RemoteErrorHandler(String target) {
        this.target = target;
    }

    @Override
    public void handle(HttpRequest request, ClientHttpResponse response) throws IOException {
        HttpStatusCode status = response.getStatusCode();
        if (status.is5xxServerError()) {
            throw new RemoteServiceException(target + " service is unavailable");
        }
        String detail = remoteDetail(response);
        if (status.isSameCodeAs(HttpStatus.NOT_FOUND)) {
            throw new ResourceNotFoundException(
                    detail != null ? detail : target + " resource not found");
        }
        throw new BusinessException(
                detail != null
                        ? detail
                        : target + " service rejected the request with status " + status.value());
    }

    private static String remoteDetail(ClientHttpResponse response) {
        try {
            JsonNode detail = JSON.readTree(response.getBody()).path("detail");
            return detail.isString() ? detail.asString() : null;
        } catch (IOException | JacksonException e) {
            return null;
        }
    }
}
