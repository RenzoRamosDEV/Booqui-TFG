package com.booqi.user.controller;

import com.booqi.user.dto.request.CreateUserRequest;
import com.booqi.user.dto.request.LoginRequest;
import com.booqi.user.dto.request.UpdateUserRequest;
import com.booqi.user.dto.request.UserFilter;
import com.booqi.user.dto.response.UserResponse;
import com.booqi.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@Tag(name = "Users", description = "Registration, lookup, update, deletion and login of Booqi users")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "Create a user", description = "Role defaults to CUSTOMER when absent")
    @ApiResponse(responseCode = "201", description = "User created; Location points to the new resource")
    @ApiResponse(responseCode = "400", description = "Validation failed or malformed body")
    @ApiResponse(responseCode = "409", description = "contactEmail already in use")
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        return ResponseEntity.created(URI.create("/api/v1/users/" + created.id())).body(created);
    }

    @Operation(summary = "List users",
            description = "Optional filters; only one at a time, except firstName and lastName together")
    @ApiResponse(responseCode = "200", description = "Matching users (possibly empty)")
    @ApiResponse(responseCode = "400", description = "More than one filter supplied")
    @GetMapping
    public ResponseEntity<List<UserResponse>> findAll(@ParameterObject @ModelAttribute UserFilter filter) {
        return ResponseEntity.ok(userService.findAll(filter));
    }

    @Operation(summary = "Get a user by id")
    @ApiResponse(responseCode = "200", description = "User found")
    @ApiResponse(responseCode = "400", description = "Non-numeric id")
    @ApiResponse(responseCode = "404", description = "User not found")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @Operation(summary = "Update a user", description = "Only the non-null fields are applied")
    @ApiResponse(responseCode = "200", description = "User updated")
    @ApiResponse(responseCode = "400", description = "Validation failed or malformed body")
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "409", description = "contactEmail already in use")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @Operation(summary = "Delete a user")
    @ApiResponse(responseCode = "204", description = "User deleted")
    @ApiResponse(responseCode = "404", description = "User not found")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Log in with email and password")
    @ApiResponse(responseCode = "200", description = "Credentials valid; returns the user")
    @ApiResponse(responseCode = "400", description = "Missing or malformed fields")
    @ApiResponse(responseCode = "401", description = "Invalid email or password")
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }
}
