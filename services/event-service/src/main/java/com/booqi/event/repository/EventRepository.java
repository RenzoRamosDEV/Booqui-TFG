package com.booqi.event.repository;

import com.booqi.event.entity.Event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findByContactEmail(String contactEmail);

    boolean existsByContactEmail(String contactEmail);

    List<Event> findByTitleContainingIgnoreCase(String title);

    List<Event> findByCategoryIgnoreCase(String category);

    List<Event> findByLocationContainingIgnoreCase(String location);

    List<Event> findByOrganizerContainingIgnoreCase(String organizer);
}
