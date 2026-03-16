package com.grocery.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.Optional;

import com.grocery.model.Customer;
import com.grocery.repository.CustomerRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200", "https://lasignare.abdoudiallo.fr"}, allowCredentials = "true")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomerRepository customerRepository;

    private ResponseCookie createJwtCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from("jwt", token)
            .httpOnly(true)       // forbids JavaScript blocks XSS
            .secure(true)         
            .path("/")            
            .maxAge(maxAgeSeconds)
            .sameSite("Strict")
            .build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<Customer> userOpt = customerRepository.findByEmail(email);

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            Customer user = userOpt.get();
            
            String token = jwtUtil.generateToken(user.getEmail(), user.isAdmin());
            ResponseCookie jwtCookie = createJwtCookie(token, 60 * 60); //  hour long lifespan

            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(Map.of("message", "Login successful", "user", user)); // returns user
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Customer newCustomer) {
        // checks for duplicate registrations
        if (customerRepository.findByEmail(newCustomer.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email is already in use"));
        }
        if (newCustomer.getPhone() != null && !newCustomer.getPhone().trim().isEmpty()) {
            if (customerRepository.findByPhone(newCustomer.getPhone()).isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "This phone number is already in use."));
            }
        }

        // new users are always basic
        newCustomer.setAdmin(false);
        Customer savedCustomer = customerRepository.save(newCustomer);
        
        // Generate token for auto-login after register
        String token = jwtUtil.generateToken(savedCustomer.getEmail(), savedCustomer.isAdmin());
        ResponseCookie jwtCookie = createJwtCookie(token, 60 * 60);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
            .body(Map.of("message", "Registered successfully", "user", savedCustomer));
    }

	@GetMapping("/validate-admin")
    public ResponseEntity<?> validateAdmin() {
        //  checks the roles from the HttpOnly JWT Cookie 
        boolean isReallyAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isReallyAdmin) {
            return ResponseEntity.ok(Map.of("message", "Authorized"));
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Denied: Fake Admin Detected"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // maxAge(0) tells browser to destroy cookies
        ResponseCookie deleteCookie = createJwtCookie("", 0);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
            .body(Map.of("message", "Logged out successfully"));
    }
}