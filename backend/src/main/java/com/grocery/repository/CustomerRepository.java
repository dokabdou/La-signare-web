package com.grocery.repository;

import com.grocery.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    Optional<Customer> findByNameIgnoreCase(String name);
	Optional<Customer> findByEmail(String email);
}