package com.grocery.controller;

import com.grocery.model.Order;
import com.grocery.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:4200", "https://lasignare.abdoudiallo.fr"}, allowCredentials = "true")
public class OrderController {
    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    private String getCurrentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        if (!isAdmin()) {
            order.setEmail(getCurrentEmail());
        }
        return ResponseEntity.ok(service.createOrder(order));
    }

    @GetMapping
    public ResponseEntity<?> getOrders() {
        List<Order> allOrders = service.getOrders();
        
        if (isAdmin()) {
            return ResponseEntity.ok(allOrders); 
        } else {
            String currentEmail = getCurrentEmail();
            List<Order> userOrders = allOrders.stream()
                    .filter(o -> o.getEmail().equals(currentEmail))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(userOrders);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable String id) {
        Order order = service.getOrderById(id);
        if (order == null) return ResponseEntity.notFound().build();

        if (!isAdmin() && !order.getEmail().equals(getCurrentEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Order getOrder : Access Blocked"));
        }
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable String id, @RequestBody Order order) {
        Order existingOrder = service.getOrderById(id);
        if (existingOrder == null) return ResponseEntity.notFound().build();

        if (!isAdmin() && !existingOrder.getEmail().equals(getCurrentEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Order updateOrder : Access Blocked"));
        }
        return ResponseEntity.ok(service.updateOrder(id, order));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String id, @RequestBody String status) {
        if (!isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Order updateOrderStatus : Only admin can change order status"));
        }
        return ResponseEntity.ok(service.updateOrderStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable String id) {
        Order existingOrder = service.getOrderById(id);
        if (existingOrder == null) return ResponseEntity.notFound().build();

        if (!isAdmin() && !existingOrder.getEmail().equals(getCurrentEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Order deleteOrder : Access Blocked"));
        }
        service.deleteOrder(id);
        return ResponseEntity.ok().build();
    }
}