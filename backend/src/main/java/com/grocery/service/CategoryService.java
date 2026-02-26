package com.grocery.service;

import com.grocery.model.Category;
import com.grocery.repository.CategoryRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {
    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    public Category createCategory(Category category) {
        return repository.save(category);
    }

    public List<Category> getCategories() {
        return repository.findAll();
    }

    public Category getCategoryById(String id) {
        return repository.findById(id).orElse(null);
    }

    public Category updateCategory(String id, Category category) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setName(category.getName());
                    return repository.save(existing);
                })
                .orElse(null);
    }

    public void deleteCategory(String id) {
        repository.deleteById(id);
    }

    @PostConstruct
    public void seed() {
        if (repository.count() == 0) {
            repository.save(new Category("meats"));
            repository.save(new Category("dairy"));
            repository.save(new Category("fruits"));
            repository.save(new Category("vegetables"));
        }
    }
}