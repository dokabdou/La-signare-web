package com.grocery.service;

import com.grocery.model.Order;
import com.grocery.model.OrderItem;
import com.grocery.model.Product;
import com.grocery.repository.OrderRepository;
import com.grocery.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {
    private final OrderRepository repository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    public OrderService(OrderRepository repository, ProductRepository productRepository, EmailService emailService) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.emailService = emailService;
    }

    private void validatePricesAndDeductStock(Order order, boolean isNewOrder) {
        double realTotal = 0.0;

        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Product realProduct = productRepository.findById(item.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found: " + item.getId()));

                System.out.println("realProduct  " + realProduct.getAllInfo() );
                if (isNewOrder) {
                    if (realProduct.getQuantity() < item.getQuantity()) {
                        throw new IllegalArgumentException("Not enough stock for: " + realProduct.getName() + ". Only " + realProduct.getQuantity() + " left.");
                    }
                    System.out.println("item quantity " + item.getQuantity() );
                    System.out.println("B realProduct quantity " + realProduct.getQuantity() );
                    
                    realProduct.setQuantity(realProduct.getQuantity() - item.getQuantity());
                    
                    System.out.println("Af realProduct quantity " + realProduct.getQuantity() );

                    if (realProduct.getQuantity() < 10) {
                        try {
                            String subject = "⚠️ ALERTE STOCK FAIBLE : " + realProduct.getName();
                            String body = "<h3>Alerte de stock critique</h3>" +
                                          "<p>Le produit <b>" + realProduct.getName() + "</b> a atteint un niveau de stock critique suite à une commande.</p>" +
                                          "<p>Quantité restante : <b style='color:red; font-size:1.2rem;'>" + realProduct.getQuantity() + "</b></p>" +
                                          "<p>Pensez à réapprovisionner vos stocks !</p>";
                                          
                            emailService.sendHtmlEmail("abdoulaye.dllo2002@gmail.com", subject, body);
                            System.out.println("Alerte de stock envoyée pour : " + realProduct.getName());
                        } catch (Exception e) {
                            // We catch the exception so that if the email fails, it doesn't crash the user's checkout!
                            System.err.println("Erreur lors de l'envoi de l'alerte de stock: " + e.getMessage());
                        }
                    }

                    productRepository.save(realProduct);
                }

                item.setPrice(realProduct.getPrice());

                realTotal += (realProduct.getPrice() * item.getQuantity());
            }
        }

        order.setTotal(realTotal);
    }

    public Order createOrder(Order order) {
        validatePricesAndDeductStock(order, true);
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
                    validatePricesAndDeductStock(updated, false);

                    existing.setCustomerName(updated.getCustomerName());
                    existing.setPhone(updated.getPhone());
                    existing.setEmail(updated.getEmail());
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