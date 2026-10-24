package com.booqi.payment.repository;

import com.booqi.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserId(Long userId);

    List<Payment> findByEventId(Long eventId);

    List<Payment> findByBookingId(Long bookingId);

    List<Payment> findByStatus(String status);
}
