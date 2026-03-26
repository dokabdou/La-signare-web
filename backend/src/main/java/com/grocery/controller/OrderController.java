package com.grocery.controller;

import com.grocery.dto.EmailRequest;
import com.grocery.model.Order;
import com.grocery.service.EmailService;
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
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4205", "https://lasignare.abdoudiallo.fr"}, allowCredentials = "true")
public class OrderController {
    private final OrderService service;
	private final EmailService emailService;

    public OrderController(OrderService service, EmailService emailService) {
        this.service = service;
		this.emailService = emailService;
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
        try {
            return ResponseEntity.ok(service.createOrder(order));
        } catch (IllegalArgumentException e) {
            // If a product ID is invalid or doesn't exist anymore
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
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
        try {
            return ResponseEntity.ok(service.updateOrder(id, order));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String id, @RequestBody String status) {
        if (!isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Order updateOrderStatus : Only admin can change order status"));
        }
        return ResponseEntity.ok(service.updateOrderStatus(id, status));
    }


	@PostMapping("/send-receipt")
    public ResponseEntity<?> sendReceipt(@RequestBody EmailRequest request) {
        if (!isAdmin() && !request.getTo().equals(getCurrentEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access Blocked"));
        }

        try {
            emailService.sendHtmlEmail(request.getTo(), request.getSubject(), request.getHtmlBody());
            
            // 2. Send to the Admin (with a modified subject)
            String adminSubject = "NOUVELLE COMMANDE - " + request.getTo();
            emailService.sendHtmlEmail("abdoulaye.dllo2002@gmail.com", adminSubject, request.getHtmlBody());
            
            System.out.println("Emails sent for order: " + request.getSubject());
            return ResponseEntity.ok(Map.of("message", "Receipts sent successfully"));
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send email receipt"));
        }
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