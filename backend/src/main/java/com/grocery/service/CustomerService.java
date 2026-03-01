package com.grocery.service;

import com.grocery.model.Customer;
import com.grocery.repository.CustomerRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {
    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    public Customer createCustomer(Customer customer) {
        return repository.save(customer);
    }

    public List<Customer> getCustomers() {
        return repository.findAll();
    }

    public Customer getCustomerById(String id) {
        return repository.findById(id).orElse(null);
    }

    public Customer updateCustomer(String id, Customer customer) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setName(customer.getName());
					existing.setPhone(customer.getPhone());
					existing.setEmail(customer.getEmail());
                    return repository.save(existing);
                })
                .orElse(null);
    }

    public void deleteCustomer(String id) {
        repository.deleteById(id);
    }

    /* @PostConstruct
    public void seed() {
        if (repository.count() == 0) {
            repository.save(new Customer("Alpha", "123-456-7890", "alpha@example.com", "password123", true));
            repository.save(new Customer("Beta", "098-765-4321", "beta@example.com", "password456", false));
            repository.save(new Customer("Gamma", "111-222-3333", "gamma@example.com", "password789", false));
            repository.save(new Customer("Delta", "444-555-6666", "delta@example.com", "password000", false));
        }
    } */
}