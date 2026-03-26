package com.grocery.controller;

import com.grocery.model.Customer;
import com.grocery.dto.UserDTO;
import com.grocery.service.CustomerService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4205", "https://lasignare.abdoudiallo.fr"}, allowCredentials = "true")
public class CustomerController {
    
    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getCustomers() {
        List<UserDTO> safeCustomers = service.getCustomers().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(safeCustomers);
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Customer customer) {
        Customer savedCustomer = service.createCustomer(customer);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(new UserDTO(savedCustomer));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomer(@PathVariable String id) {
        Customer customer = service.getCustomerById(id);
        
        if (customer == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(new UserDTO(customer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable String id, @RequestBody Customer customer) {
        try {
            Customer savedCustomer = service.updateCustomer(id, customer);

            if (savedCustomer == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(new UserDTO(savedCustomer)); 
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable String id) {
        service.deleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));
    }
}