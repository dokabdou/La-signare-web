package com.grocery.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = null;

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                }
            }
        }

        if (token != null && jwtUtil.validateToken(token)) {
            String email = jwtUtil.extractEmail(token);
            boolean isAdmin = jwtUtil.extractIsAdmin(token);

            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            if (isAdmin) {
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            } else {
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            }

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    email, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        
        chain.doFilter(request, response);
    }
}