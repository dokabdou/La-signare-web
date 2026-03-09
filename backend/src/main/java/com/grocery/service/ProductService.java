package com.grocery.service;

import com.grocery.model.Category;
import com.grocery.model.Product;
import com.grocery.repository.CategoryRepository;
import com.grocery.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository repository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository repository, CategoryRepository categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }

    public Product createProduct(Product product) {
        String catName = product.getCategory();
        if (catName != null && !catName.isEmpty()) {
            Category cat = categoryRepository.findByNameIgnoreCase(catName)
                    .orElseGet(() -> categoryRepository.save(new Category(catName)));
            product.setCategory(cat.getName());
        }
        return repository.save(product);
    }

    public List<Product> getProducts(String category, String search) {
        System.out.println("getProducts called - category: " + category + ", search: " + search);
        
        if (category != null && !category.isEmpty()) {
            List<Product> result = repository.findByCategoryIgnoreCase(category);
            System.out.println("Found " + result.size() + " products for category: " + category);
            return result;
        }
        
        if (search != null && !search.isEmpty()) {
            List<Product> result = repository.findByNameContainingIgnoreCase(search);
            System.out.println("Found " + result.size() + " products for search: " + search);
            return result;
        }
        
        return repository.findAll();
    }

    public Product getProductById(String id) {
        return repository.findById(id).orElse(null);
    }

    public Product updateProduct(String id, Product updated) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setDescription(updated.getDescription());
                    existing.setPrice(updated.getPrice());
                    existing.setImageUrl(updated.getImageUrl());
					existing.setQuantity(updated.getQuantity());
                    if (updated.getCategory() != null) {
                        Category cat = categoryRepository.findByNameIgnoreCase(updated.getCategory())
                                .orElseGet(() -> categoryRepository.save(new Category(updated.getCategory())));
                        existing.setCategory(cat.getName());
                    }
                    return repository.save(existing);
                })
                .orElse(null);
    }

    public void deleteProduct(String id) {
        repository.deleteById(id);
    }

    @PostConstruct
    public void seedDatabase() {
        if (repository.count() == 0) {
            categoryRepository.findByNameIgnoreCase("meats")
                    .orElseGet(() -> categoryRepository.save(new Category("meats")));
            categoryRepository.findByNameIgnoreCase("dairy")
                    .orElseGet(() -> categoryRepository.save(new Category("dairy")));
            categoryRepository.findByNameIgnoreCase("fruits")
                    .orElseGet(() -> categoryRepository.save(new Category("fruits")));
            categoryRepository.findByNameIgnoreCase("vegetables")
                    .orElseGet(() -> categoryRepository.save(new Category("vegetables")));

            repository.save(new Product(
                    "Wagyu Beef Steak",
                    "Premium wagyu beef steak",
                    25.50,
                    "meats",
                    "https://cdn.pixabay.com/photo/2015/03/03/22/54/meat-658029_1280.jpg"));
            repository.save(new Product(
                    "Organic Whole Milk",
                    "Fresh organic whole milk",
                    3.20,
                    "dairy",
                    "https://cdn.pixabay.com/photo/2017/07/05/15/41/milk-2474993_1280.jpg"));
            repository.save(new Product(
                    "Fresh Strawberries",
                    "Sweet fresh strawberries",
                    4.50,
                    "fruits",
                    "https://cdn.pixabay.com/photo/2022/05/12/13/04/fresh-strawberries-7191555_1280.jpg"));
            repository.save(new Product(
                    "Crisp Broccoli",
                    "Green crisp broccoli",
                    2.10,
                    "vegetables",
                    "https://cdn.pixabay.com/photo/2015/12/04/15/30/broccoli-1076652_1280.jpg"));
            System.out.println("✅ Sample products loaded into MongoDB!");
        }
    }
}