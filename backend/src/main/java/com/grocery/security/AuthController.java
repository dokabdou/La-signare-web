package com.grocery.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

import com.grocery.model.Customer;
import com.grocery.repository.CustomerRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200", "https://lasignare.abdoudiallo.fr"})
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomerRepository customerRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<Customer> userOpt = customerRepository.findByEmail(email);

        // Check if user exists and password matches
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            Customer user = userOpt.get();
            
            // Generate token WITH the admin status
            String token = jwtUtil.generateToken(user.getEmail(), user.isAdmin());

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user", user
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Customer newCustomer) {
        // Prevent registering duplicate emails
        if (customerRepository.findByEmail(newCustomer.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email is already in use"));
        }
        
        // Force new users to NOT be admins by default for safety
        newCustomer.setAdmin(false);
        Customer savedCustomer = customerRepository.save(newCustomer);
        
        // Generate token for auto-login after register
        String token = jwtUtil.generateToken(savedCustomer.getEmail(), savedCustomer.isAdmin());
        
        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", savedCustomer
        ));
    }
}