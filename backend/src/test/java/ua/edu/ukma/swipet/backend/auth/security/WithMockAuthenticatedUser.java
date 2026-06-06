package ua.edu.ukma.swipet.backend.auth.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import ua.edu.ukma.swipet.backend.auth.entity.Role;

import java.lang.annotation.*;
import java.util.List;

/**
 * Custom annotation for mocking authenticated user in tests.
 * Usage: @WithMockAuthenticatedUser(userId = 1L, role = "USER")
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@WithSecurityContext(factory = WithMockAuthenticatedUser.WithMockAuthenticatedUserSecurityContextFactory.class)
public @interface WithMockAuthenticatedUser {

    long userId() default 1L;

    String email() default "test@example.com";

    String role() default "USER";

    class WithMockAuthenticatedUserSecurityContextFactory implements WithSecurityContextFactory<WithMockAuthenticatedUser> {

        @Override
        public SecurityContext createSecurityContext(WithMockAuthenticatedUser annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            
            Role role = Role.valueOf(annotation.role());
            
            AuthenticatedUser authenticatedUser = new AuthenticatedUser(
                annotation.userId(),
                annotation.email(),
                role
            );
            
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                    authenticatedUser,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + annotation.role()))
                );
            
            context.setAuthentication(authentication);
            return context;
        }
    }
}
