package com.grocery.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // Pulls the secret string from application.yml
    @Value("${jwt.secret}")
    private String secretKeyString;

    private Key key;

    // This runs automatically right after Spring reads the application.yml
    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secretKeyString.getBytes());
    }

    // Generate the token and stamp the Admin status inside it
    public String generateToken(String email, boolean isAdmin) {
        return Jwts.builder()
                .setSubject(email)
                .claim("admin", isAdmin) // Stamping the role!
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1 hour expiration
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Read the email from the token
    public String extractEmail(String token) {
        return Jwts.parser().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    // Read the Admin stamp from the token
    public boolean extractIsAdmin(String token) {
        return Jwts.parser().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().get("admin", Boolean.class);
    }

    // Check if the token is valid and not tampered with
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}