package com.booqi.payment.service;

import com.booqi.payment.dto.request.CreatePaymentRequest;
import com.booqi.payment.dto.request.PaymentFilter;
import com.booqi.payment.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {

    List<PaymentResponse> findAll();

    List<PaymentResponse> findAll(PaymentFilter filter);

    PaymentResponse findById(Long id);

    boolean existsById(Long id);

    List<PaymentResponse> findByUserId(Long userId);

    List<PaymentResponse> findByEventId(Long eventId);

    List<PaymentResponse> findByBookingId(Long bookingId);

    List<PaymentResponse> findByStatus(String status);

    PaymentResponse process(CreatePaymentRequest request);
}
