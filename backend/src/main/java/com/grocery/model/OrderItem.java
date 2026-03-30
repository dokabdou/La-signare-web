package com.grocery.model;

public class OrderItem {
    private String id; // product id
    private String name;
    private int quantity;
    private double price; 
    private String imageUrl;
    private String category; // <-- NEW: Added category

    public OrderItem() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getAllInfo() {
        return "-- ORDER ITEM INFO : " + getId() + " _ " + getName() + " _ " + getPrice() + " _ " + getQuantity() + " _ " + getCategory() + "___";
    }
}