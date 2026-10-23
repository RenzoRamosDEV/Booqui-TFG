package com.booqi.user.repository;

import com.booqi.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByContactEmail(String contactEmail);

    boolean existsByContactEmail(String contactEmail);

    List<User> findByContactPhone(String contactPhone);

    List<User> findByRole(User.Role role);

    List<User> findByFirstNameIgnoreCase(String firstName);

    List<User> findByLastNameIgnoreCase(String lastName);

    List<User> findByFirstNameIgnoreCaseAndLastNameIgnoreCase(String firstName, String lastName);
}
