package com.grocery.service;

import com.grocery.model.Order;
import com.grocery.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {
    private final OrderRepository repository;

    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    public Order createOrder(Order order) {
        order.setCreatedAt(LocalDateTime.now());
        return repository.save(order);
    }

    public List<Order> getOrders() {
        return repository.findAll();
    }

    public List<Order> getOrdersByCustomerName(String customerName) {
        return repository.findAll().stream()
                .filter(order -> order.getCustomerName().equalsIgnoreCase(customerName))
                .toList();
    }

    public List<Order> getOrdersByEmail(String email) {
        return repository.findAll().stream()
                .filter(order -> order.getEmail().equalsIgnoreCase(email))
                .toList();
    }

    public List<Order> getOrdersByPhone(String phone) {
        return repository.findAll().stream()
                .filter(order -> order.getPhone().equalsIgnoreCase(phone))
                .toList();
    }

    public List<Order> getOrdersByDateRange(LocalDateTime start, LocalDateTime end) {
        return repository.findAll().stream()
                .filter(order -> order.getCreatedAt().isAfter(start) && order.getCreatedAt().isBefore(end))
                .toList();
    }

    public Order getOrderById(String id) {
        return repository.findById(id).orElse(null);
    }

    public List<Order> getOrdersByStatus(String status) {
        return repository.findAll().stream()
                .filter(order -> order.getStatus().equalsIgnoreCase(status))
                .toList();
    }

    public Order updateOrderStatus(String id, String status) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setStatus(status);
                    return repository.save(existing);
                })
                .orElse(null);
    }

    public Order updateOrder(String id, Order updated) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setCustomerName(updated.getCustomerName());
                    existing.setPhone(updated.getPhone());
                    existing.setEmail(updated.getEmail());
                    existing.setCreatedAt(updated.getCreatedAt());
                    existing.setItems(updated.getItems());
                    existing.setTotal(updated.getTotal());
                    existing.setStatus(updated.getStatus()); 
                    return repository.save(existing);
                })
                .orElse(null);
    }

    public void deleteOrder(String id) {
        repository.deleteById(id);
    }
}