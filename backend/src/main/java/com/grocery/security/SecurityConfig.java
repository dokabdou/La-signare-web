package com.grocery.security;

import com.grocery.security.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

	@Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .formLogin(form -> form.disable()) 
			.headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'none'; img-src 'self'; frame-ancestors 'none'; sandbox;")
                )
            )
            
            // Tell Spring Security we are using API Tokens, not standard server sessions
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth
				/* this means that :
				http://localhost:8080/api/products will display all the products
				http://localhost:8080/api/orders will display nothing, same with http://localhost:8080/api/customers
				but /api/orders will displays the orders in the networkd response of api calls
				because the Angular interceptor adds the bearer token authorization to the request and this backend accepts it
				and sends the info
				
				*/
                .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/products", "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products", "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products", "/api/products/**").hasRole("ADMIN")
                
                .requestMatchers("/api/auth", "/api/auth/**").permitAll()
                
                // --- CUSTOMERS ---
                // Only Admins can list ALL customers or delete customers
                .requestMatchers(HttpMethod.GET, "/api/customers").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/customers/**").hasRole("ADMIN")

				// ANY logged-in user needs to be able to fetch or update their OWN profile
                .requestMatchers(HttpMethod.GET, "/api/customers/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/customers/**").authenticated()
                
                // Orders: ANY logged-in user can create/view their own orders
				.requestMatchers(HttpMethod.GET, "/api/orders", "/api/orders/**").authenticated()
				.requestMatchers(HttpMethod.POST, "/api/orders", "/api/orders/**").authenticated()
				.requestMatchers(HttpMethod.PUT, "/api/orders", "/api/orders/**").authenticated()

                
                .anyRequest().authenticated()
            );
            
        // Put our Bouncer at the front door to check tokens BEFORE Spring blocks the request!
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}