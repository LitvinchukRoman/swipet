package ua.edu.ukma.swipet.backend.swipe.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import ua.edu.ukma.swipet.backend.analytics.service.AnalyticsService;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.swipe.dto.SwipeRequest;
import ua.edu.ukma.swipet.backend.swipe.entity.Swipe;
import ua.edu.ukma.swipet.backend.swipe.entity.SwipeDirection;
import ua.edu.ukma.swipet.backend.swipe.repository.SwipeRepository;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SwipeServiceTest {

    @Mock
    private SwipeRepository swipeRepository;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private SwipeService swipeService;

    private User testUser;
    private Animal testAnimal;
    private SwipeRequest swipeRequest;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .build();

        testAnimal = Animal.builder()
                .id(1L)
                .name("Test Animal")
                .build();

        swipeRequest = new SwipeRequest(1L, SwipeDirection.RIGHT);
    }

    @Test
    void recordSwipe_Success() {
        // Arrange
        when(swipeRepository.existsByUserIdAndAnimalId(1L, 1L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(animalRepository.findById(1L)).thenReturn(Optional.of(testAnimal));
        
        Swipe savedSwipe = Swipe.builder()
                .id(1L)
                .user(testUser)
                .animal(testAnimal)
                .direction(SwipeDirection.RIGHT)
                .build();
        when(swipeRepository.save(any(Swipe.class))).thenReturn(savedSwipe);

        // Act
        Map<String, Long> result = swipeService.recordSwipe(1L, swipeRequest);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.get("swipeId"));
        verify(swipeRepository).save(any(Swipe.class));
    }

    @Test
    void recordSwipe_DuplicateSwipe_ThrowsAppException() {
        // Arrange
        when(swipeRepository.existsByUserIdAndAnimalId(1L, 1L)).thenReturn(true);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> 
            swipeService.recordSwipe(1L, swipeRequest)
        );
        
        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("CONFLICT", exception.getCode());
        assertEquals("Ви вже свайпнули цю тварину", exception.getMessage());
        
        verify(swipeRepository, never()).save(any(Swipe.class));
    }

    @Test
    void recordSwipe_UserNotFound_ThrowsAppException() {
        // Arrange
        when(swipeRepository.existsByUserIdAndAnimalId(1L, 1L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> 
            swipeService.recordSwipe(1L, swipeRequest)
        );
        
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("NOT_FOUND", exception.getCode());
        assertEquals("Користувача не знайдено", exception.getMessage());
        
        verify(animalRepository, never()).findById(anyLong());
        verify(swipeRepository, never()).save(any(Swipe.class));
    }

    @Test
    void recordSwipe_AnimalNotFound_ThrowsAppException() {
        // Arrange
        when(swipeRepository.existsByUserIdAndAnimalId(1L, 1L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(animalRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> 
            swipeService.recordSwipe(1L, swipeRequest)
        );
        
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("NOT_FOUND", exception.getCode());
        assertEquals("Тварину не знайдено", exception.getMessage());
        
        verify(swipeRepository, never()).save(any(Swipe.class));
    }

    @Test
    void recordSwipe_RaceCondition_ThrowsAppException() {
        // Arrange
        when(swipeRepository.existsByUserIdAndAnimalId(1L, 1L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(animalRepository.findById(1L)).thenReturn(Optional.of(testAnimal));
        when(swipeRepository.save(any(Swipe.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate key"));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> 
            swipeService.recordSwipe(1L, swipeRequest)
        );
        
        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("CONFLICT", exception.getCode());
        assertEquals("Ви вже відреагували на цю анкету", exception.getMessage());
    }
}
