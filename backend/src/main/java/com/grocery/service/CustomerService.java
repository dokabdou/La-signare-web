package com.grocery.service;

import com.grocery.model.Customer;
import com.grocery.repository.CustomerRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {
    private final CustomerRepository repository;
	private final PasswordEncoder passwordEncoder;

    public CustomerService(CustomerRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public Customer createCustomer(Customer customer) {
        if (customer.getPassword() != null && !customer.getPassword().trim().isEmpty()) {
            customer.setPassword(passwordEncoder.encode(customer.getPassword()));
        }
        return repository.save(customer);
    }

    public List<Customer> getCustomers() {
        return repository.findAll();
    }

    public Customer getCustomerById(String id) {
        return repository.findById(id).orElse(null);
    }

    public Customer updateCustomer(String id, Customer updatedData) {
		Optional<Customer> existingOpt = repository.findById(id);
        if (existingOpt.isEmpty()) {
            return null; // Customer doesn't exist
        }
		Customer existingCustomer = existingOpt.get();

		String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

		if (!isAdmin && !existingCustomer.getEmail().equals(currentEmail)) {
            throw new SecurityException("Access Denied: You can only edit your own profile.");
        }

		if (updatedData.getName() != null) {
            existingCustomer.setName(updatedData.getName());
        }
        if (updatedData.getPhone() != null) {
            existingCustomer.setPhone(updatedData.getPhone());
        }

		if (updatedData.getPassword() != null && !updatedData.getPassword().trim().isEmpty()) {
            String hashedPassword = passwordEncoder.encode(updatedData.getPassword());
            existingCustomer.setPassword(hashedPassword);
        }

        return repository.save(existingCustomer);
    }

    public void deleteCustomer(String id) {
        repository.deleteById(id);
    }
}