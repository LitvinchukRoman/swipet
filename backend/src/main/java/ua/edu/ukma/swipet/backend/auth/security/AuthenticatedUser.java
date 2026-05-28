package ua.edu.ukma.swipet.backend.auth.security;

import ua.edu.ukma.swipet.backend.auth.entity.Role;

/**
 * Легкий principal, який кладеться в SecurityContext без додаткового запиту до БД на кожен запит.
 */
public record AuthenticatedUser(Long id, String email, Role role) { }
