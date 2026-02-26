package com.grocery.model;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor
public class OrderItem {
    private String productId;
    private String name;
    private int quantity;
    private double price;
}