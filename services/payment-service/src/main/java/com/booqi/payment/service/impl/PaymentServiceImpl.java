package com.booqi.payment.service.impl;

import com.booqi.payment.client.BookingClient;
import com.booqi.payment.client.EventClient;
import com.booqi.payment.dto.request.CreatePaymentRequest;
import com.booqi.payment.dto.request.PaymentFilter;
import com.booqi.payment.dto.response.PaymentResponse;
import com.booqi.payment.entity.Payment;
import com.booqi.payment.exception.BusinessException;
import com.booqi.payment.exception.InvalidFilterException;
import com.booqi.payment.exception.ResourceNotFoundException;
import com.booqi.payment.mapper.PaymentMapper;
import com.booqi.payment.repository.PaymentRepository;
import com.booqi.payment.service.PaymentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    static final String SINGLE_FILTER_MESSAGE = "Only one filter may be used at a time";

    private static final BigDecimal MAX_TOTAL_PRICE = new BigDecimal("99999999.99");

    private static final String PENDING = "PENDING";
    private static final String APPROVED = "APPROVED";
    private static final String REJECTED = "REJECTED";

    private final PaymentRepository paymentRepository;
    private final EventClient eventClient;
    private final BookingClient bookingClient;
    private final PaymentMapper paymentMapper;

    @Override
    public List<PaymentResponse> findAll() {
        return paymentMapper.toResponseList(paymentRepository.findAll());
    }

    @Override
    public List<PaymentResponse> findAll(PaymentFilter filter) {
        boolean byUser = filter.userId() != null;
        boolean byEvent = filter.eventId() != null;
        boolean byBooking = filter.bookingId() != null;
        boolean byStatus = StringUtils.hasText(filter.status());
        if (countTrue(byUser, byEvent, byBooking, byStatus) > 1) {
            throw new InvalidFilterException(SINGLE_FILTER_MESSAGE);
        }
        if (byUser) {
            log.debug("Listing payments filtered by userId");
            return findByUserId(filter.userId());
        }
        if (byEvent) {
            log.debug("Listing payments filtered by eventId");
            return findByEventId(filter.eventId());
        }
        if (byBooking) {
            log.debug("Listing payments filtered by bookingId");
            return findByBookingId(filter.bookingId());
        }
        if (byStatus) {
            log.debug("Listing payments filtered by status");
            return findByStatus(filter.status());
        }
        return findAll();
    }

    @Override
    public PaymentResponse findById(Long id) {
        return paymentRepository
                .findById(id)
                .map(paymentMapper::toResponse)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Payment with id " + id + " not found"));
    }

    @Override
    public boolean existsById(Long id) {
        return paymentRepository.existsById(id);
    }

    @Override
    public List<PaymentResponse> findByUserId(Long userId) {
        return paymentMapper.toResponseList(paymentRepository.findByUserId(userId));
    }

    @Override
    public List<PaymentResponse> findByEventId(Long eventId) {
        return paymentMapper.toResponseList(paymentRepository.findByEventId(eventId));
    }

    @Override
    public List<PaymentResponse> findByBookingId(Long bookingId) {
        return paymentMapper.toResponseList(paymentRepository.findByBookingId(bookingId));
    }

    @Override
    public List<PaymentResponse> findByStatus(String status) {
        return paymentMapper.toResponseList(paymentRepository.findByStatus(status));
    }

    @Override
    @Transactional
    public PaymentResponse process(CreatePaymentRequest request) {
        if (request.totalPrice().compareTo(MAX_TOTAL_PRICE) > 0) {
            throw new BusinessException("Total price must not exceed " + MAX_TOTAL_PRICE);
        }
        log.info(
                "Starting payment for booking {}, user {}, event {}, {} tickets",
                request.bookingId(),
                request.userId(),
                request.eventId(),
                request.ticketQuantity());

        Payment payment =
                paymentRepository.save(
                        Payment.builder()
                                .bookingId(request.bookingId())
                                .userId(request.userId())
                                .eventId(request.eventId())
                                .ticketQuantity(request.ticketQuantity())
                                .totalPrice(request.totalPrice())
                                .paymentMethod(request.paymentMethod())
                                .status(PENDING)
                                .build());
        log.info("Payment {} registered as PENDING", payment.getId());

        try {
            if (simulateApproval(request)) {
                eventClient.decrementStock(request.eventId(), request.ticketQuantity());
                bookingClient.confirm(request.bookingId());
                payment.setStatus(APPROVED);
                payment.setTransactionId(UUID.randomUUID().toString());
                payment.setPaymentDate(LocalDateTime.now());
                payment = paymentRepository.save(payment);
                log.info(
                        "Payment {} approved with transaction {}",
                        payment.getId(),
                        payment.getTransactionId());
            } else {
                payment.setStatus(REJECTED);
                payment.setErrorMessage("Payment rejected by simulation");
                payment.setPaymentDate(LocalDateTime.now());
                payment = paymentRepository.save(payment);
                log.warn(
                        "Payment {} rejected for booking {}", payment.getId(), request.bookingId());
                bookingClient.cancel(request.bookingId());
            }
        } catch (Exception e) {
            log.error("Payment {} failed: {}", payment.getId(), e.getMessage(), e);
            payment.setStatus(REJECTED);
            payment.setErrorMessage(e.getMessage());
            payment.setPaymentDate(LocalDateTime.now());
            payment = paymentRepository.save(payment);
            cancelBookingQuietly(request.bookingId());
        }
        return paymentMapper.toResponse(payment);
    }

    private boolean simulateApproval(CreatePaymentRequest request) {
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        String cardNumber = request.cardNumber();
        boolean approved =
                cardNumber == null
                        || cardNumber.isEmpty()
                        || Character.getNumericValue(cardNumber.charAt(cardNumber.length() - 1)) % 2
                                == 0;
        log.info(
                "Simulated payment {} for method {}",
                approved ? APPROVED : REJECTED,
                request.paymentMethod());
        return approved;
    }

    private void cancelBookingQuietly(Long bookingId) {
        try {
            bookingClient.cancel(bookingId);
        } catch (Exception e) {
            log.error(
                    "Could not cancel booking {} after payment failure: {}",
                    bookingId,
                    e.getMessage());
        }
    }

    private static long countTrue(boolean... conditions) {
        long count = 0;
        for (boolean condition : conditions) {
            if (condition) {
                count++;
            }
        }
        return count;
    }
}
