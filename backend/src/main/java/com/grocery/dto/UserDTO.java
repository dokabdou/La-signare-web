package com.grocery.dto;

import com.grocery.model.Customer;

public class UserDTO {
    private String id;
    private String name;
    private String phone;
    private String email;
    private boolean isAdmin;

    // Constructor that automatically converts a real Customer into this safe DTO
    public UserDTO(Customer customer) {
        this.id = customer.getId();
        this.name = customer.getName();
        this.phone = customer.getPhone();
        this.email = customer.getEmail();
        this.isAdmin = customer.isAdmin();
    }

    public String getId() { 
		return id; 
	}
    public String getName() { 
		return name; 
	}
    public String getPhone() { 
		return phone; 
	}
    public String getEmail() { 
		return email; 
	}
    public boolean isAdmin() { 
		return isAdmin; 
	}
}