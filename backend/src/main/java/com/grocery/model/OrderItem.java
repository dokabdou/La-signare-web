package com.grocery.model;

public class OrderItem {
    private String id; // product id
    private String name;
    private int quantity;
    private double price; // This is what the frontend sends, overwritten by the backend for security reasons !

    public OrderItem() {}

    public String getId() { 
		return id; 
	}
    public void setid(String id) { 
		this.id = id; 
	}

    public String getName() { 
		return name; 
	}
    public void setName(String name) { 
		this.name = name; 
	}

    public int getQuantity() { 
		return quantity; 
	}
    public void setQuantity(int quantity) { 
		this.quantity = quantity; 
	}

    public double getPrice() { 
		return price; 
	}
    public void setPrice(double price) { 
		this.price = price;
	}
}