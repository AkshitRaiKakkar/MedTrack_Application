package com.medtrack.auth.controller;

import com.medtrack.auth.dto.AuthResponse;
import com.medtrack.auth.dto.LoginRequest;
import com.medtrack.auth.model.User;
import com.medtrack.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UserController exposes the REST endpoints for user authentication operations,
 * specifically handling new user registration and user login requests.
 *
 * <p>Annotations used:
 * <ul>
 *   <li>{@code @RestController}: Indicates that this class is a controller where all methods return JSON/XML response bodies directly instead of rendering HTML templates.</li>
 *   <li>{@code @RequestMapping("/api/user")}: Configures the base URI mapping for all endpoints exposed by this controller.</li>
 *   <li>{@code @RequiredArgsConstructor}: Lombok annotation that automatically generates a constructor to inject all {@code final} fields (such as {@link UserService}).</li>
 *   <li>{@code @CrossOrigin(origins = "http://localhost:3000")}: Allows Cross-Origin Resource Sharing (CORS) requests specifically from the frontend application running on port 3000, enabling secure communication across different ports.</li>
 * </ul>
 * </p>
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    /**
     * Service class containing the business logic for user management,
     * credential validation, and JWT generation.
     */
    private final UserService userService;

    /**
     * Registers a new user within the application database.
     *
     * <p>This endpoint validates the incoming user details according to validation annotations defined on the {@link User} entity 
     * (e.g., non-empty username, valid email pattern, password constraints). Upon successful registration, a JSON token is returned
     * to automatically sign the user in.</p>
     *
     * @param user the {@link User} object parsed from the JSON request body.
     *             {@code @Valid} triggers validation constraints check on the model.
     *             {@code @RequestBody} maps the HTTP request body directly to this object.
     * @return a {@link ResponseEntity} wrapping the {@link AuthResponse} containing the generated JWT token and registered user details.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody User user) {
        // Delegate user registration to the service layer and return HTTP 200 (OK) with the auth response
        return ResponseEntity.ok(userService.register(user));
    }

    /**
     * Authenticates an existing user using their email and password.
     *
     * <p>This endpoint validates that login credentials are formatted correctly before processing authentication. If credentials
     * match an existing user account and the password matches the hashed password stored in the database, a new JWT token is returned.</p>
     *
     * @param loginRequest the {@link LoginRequest} object containing user email and raw password.
     *                     {@code @Valid} enforces validation rules defined on the request DTO.
     *                     {@code @RequestBody} binds the HTTP request payload to the DTO.
     * @return a {@link ResponseEntity} wrapping the {@link AuthResponse} containing the JWT token for subsequent authenticated API requests.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        // Delegate user validation/sign-in to the service layer and return HTTP 200 (OK) with the auth response
        return ResponseEntity.ok(userService.login(loginRequest));
    }
}
