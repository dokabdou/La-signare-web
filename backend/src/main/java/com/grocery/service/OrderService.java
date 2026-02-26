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

    public Order getOrderById(String id) {
        return repository.findById(id).orElse(null);
    }

    public Order updateOrder(String id, Order updated) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setCustomerName(updated.getCustomerName());
                    existing.setPhone(updated.getPhone());
                    existing.setItems(updated.getItems());
                    existing.setTotal(updated.getTotal());
                    return repository.save(existing);
                })
                .orElse(null);
    }

    public void deleteOrder(String id) {
        repository.deleteById(id);
    }
}