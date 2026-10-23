package com.booqi.user.service.impl;

import com.booqi.user.dto.request.CreateUserRequest;
import com.booqi.user.dto.request.LoginRequest;
import com.booqi.user.dto.request.UpdateUserRequest;
import com.booqi.user.dto.request.UserFilter;
import com.booqi.user.dto.response.UserResponse;
import com.booqi.user.entity.User;
import com.booqi.user.exception.ConflictException;
import com.booqi.user.exception.InvalidCredentialsException;
import com.booqi.user.exception.InvalidFilterException;
import com.booqi.user.exception.ResourceNotFoundException;
import com.booqi.user.mapper.UserMapper;
import com.booqi.user.repository.UserRepository;
import com.booqi.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    static final String SINGLE_FILTER_MESSAGE =
            "Only one filter may be used at a time (firstName and lastName may be combined)";
    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserResponse> findAll() {
        return userMapper.toResponseList(userRepository.findAll());
    }

    @Override
    public List<UserResponse> findAll(UserFilter filter) {
        boolean byEmail = StringUtils.hasText(filter.contactEmail());
        boolean byPhone = StringUtils.hasText(filter.contactPhone());
        boolean byRole = StringUtils.hasText(filter.role());
        boolean byFirstName = StringUtils.hasText(filter.firstName());
        boolean byLastName = StringUtils.hasText(filter.lastName());
        if (countTrue(byEmail, byPhone, byRole, byFirstName || byLastName) > 1) {
            throw new InvalidFilterException(SINGLE_FILTER_MESSAGE);
        }
        if (byEmail) {
            log.debug("Listing users filtered by contactEmail");
            return findByContactEmail(filter.contactEmail());
        }
        if (byPhone) {
            log.debug("Listing users filtered by contactPhone");
            return findByContactPhone(filter.contactPhone());
        }
        if (byRole) {
            log.debug("Listing users filtered by role");
            return findByRole(filter.role());
        }
        if (byFirstName && byLastName) {
            log.debug("Listing users filtered by firstName and lastName");
            return findByFirstNameAndLastName(filter.firstName(), filter.lastName());
        }
        if (byFirstName) {
            log.debug("Listing users filtered by firstName");
            return findByFirstName(filter.firstName());
        }
        if (byLastName) {
            log.debug("Listing users filtered by lastName");
            return findByLastName(filter.lastName());
        }
        return findAll();
    }

    @Override
    public UserResponse findById(Long id) {
        return userMapper.toResponse(getUser(id));
    }

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByContactEmail(request.contactEmail())) {
            throw duplicateEmail(request.contactEmail());
        }
        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(StringUtils.hasText(request.role()) ? User.Role.valueOf(request.role()) : User.Role.CUSTOMER);
        User saved = userRepository.save(user);
        log.info("User {} created", saved.getId());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getUser(id);
        String newEmail = request.contactEmail();
        if (newEmail != null && !newEmail.equals(user.getContactEmail())
                && userRepository.existsByContactEmail(newEmail)) {
            throw duplicateEmail(newEmail);
        }
        userMapper.updateEntity(request, user);
        if (StringUtils.hasText(request.role())) {
            user.setRole(User.Role.valueOf(request.role()));
        }
        if (StringUtils.hasText(request.password())) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        User saved = userRepository.save(user);
        log.info("User {} updated", id);
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw notFound(id);
        }
        userRepository.deleteById(id);
        log.info("User {} deleted", id);
    }

    @Override
    public boolean existsById(Long id) {
        return userRepository.existsById(id);
    }

    @Override
    public List<UserResponse> findByContactEmail(String contactEmail) {
        if (!StringUtils.hasText(contactEmail)) {
            return List.of();
        }
        return userRepository.findByContactEmail(contactEmail)
                .map(user -> List.of(userMapper.toResponse(user)))
                .orElse(List.of());
    }

    @Override
    public List<UserResponse> findByContactPhone(String contactPhone) {
        if (!StringUtils.hasText(contactPhone)) {
            return List.of();
        }
        return userMapper.toResponseList(userRepository.findByContactPhone(contactPhone));
    }

    @Override
    public List<UserResponse> findByRole(String role) {
        if (!StringUtils.hasText(role)) {
            return List.of();
        }
        try {
            return userMapper.toResponseList(userRepository.findByRole(User.Role.valueOf(role.toUpperCase())));
        } catch (IllegalArgumentException unknownRole) {
            return List.of();
        }
    }

    @Override
    public List<UserResponse> findByFirstName(String firstName) {
        if (!StringUtils.hasText(firstName)) {
            return List.of();
        }
        return userMapper.toResponseList(userRepository.findByFirstNameIgnoreCase(firstName));
    }

    @Override
    public List<UserResponse> findByLastName(String lastName) {
        if (!StringUtils.hasText(lastName)) {
            return List.of();
        }
        return userMapper.toResponseList(userRepository.findByLastNameIgnoreCase(lastName));
    }

    @Override
    public List<UserResponse> findByFirstNameAndLastName(String firstName, String lastName) {
        if (!StringUtils.hasText(firstName) || !StringUtils.hasText(lastName)) {
            return List.of();
        }
        return userMapper.toResponseList(
                userRepository.findByFirstNameIgnoreCaseAndLastNameIgnoreCase(firstName, lastName));
    }

    @Override
    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByContactEmail(request.contactEmail())
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPassword()))
                .orElseThrow(() -> {
                    log.warn("Rejected login attempt");
                    return new InvalidCredentialsException(INVALID_CREDENTIALS_MESSAGE);
                });
        log.info("User {} logged in", user.getId());
        return userMapper.toResponse(user);
    }

    private User getUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> notFound(id));
    }

    private static ResourceNotFoundException notFound(Long id) {
        return new ResourceNotFoundException("User with id " + id + " not found");
    }

    private static ConflictException duplicateEmail(String contactEmail) {
        return new ConflictException("User with contactEmail " + contactEmail + " already exists");
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
