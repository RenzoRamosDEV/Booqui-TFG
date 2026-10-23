package com.booqi.user.service;

import com.booqi.user.dto.request.CreateUserRequest;
import com.booqi.user.dto.request.LoginRequest;
import com.booqi.user.dto.request.UpdateUserRequest;
import com.booqi.user.dto.request.UserFilter;
import com.booqi.user.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> findAll();

    List<UserResponse> findAll(UserFilter filter);

    UserResponse findById(Long id);

    UserResponse create(CreateUserRequest request);

    UserResponse update(Long id, UpdateUserRequest request);

    void delete(Long id);

    boolean existsById(Long id);

    List<UserResponse> findByContactEmail(String contactEmail);

    List<UserResponse> findByContactPhone(String contactPhone);

    List<UserResponse> findByRole(String role);

    List<UserResponse> findByFirstName(String firstName);

    List<UserResponse> findByLastName(String lastName);

    List<UserResponse> findByFirstNameAndLastName(String firstName, String lastName);

    UserResponse login(LoginRequest request);
}
