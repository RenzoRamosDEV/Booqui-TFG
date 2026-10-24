package com.booqi.payment.mapper;

import com.booqi.payment.dto.response.PaymentResponse;
import com.booqi.payment.entity.Payment;

import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    PaymentResponse toResponse(Payment payment);

    List<PaymentResponse> toResponseList(List<Payment> payments);
}
