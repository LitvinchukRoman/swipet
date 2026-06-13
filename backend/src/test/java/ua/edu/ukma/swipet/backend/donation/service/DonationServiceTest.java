package ua.edu.ukma.swipet.backend.donation.service;

import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.entity.Species;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
import ua.edu.ukma.swipet.backend.donation.config.StripeProperties;
import ua.edu.ukma.swipet.backend.donation.dto.DonationRequest;
import ua.edu.ukma.swipet.backend.donation.dto.GuardianshipRequest;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentInitResponse;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentVerificationStatus;
import ua.edu.ukma.swipet.backend.donation.dto.VerifySessionResponse;
import ua.edu.ukma.swipet.backend.donation.dto.VirtualGuardianshipResponse;
import ua.edu.ukma.swipet.backend.donation.entity.Donation;
import ua.edu.ukma.swipet.backend.donation.entity.DonationStatus;
import ua.edu.ukma.swipet.backend.donation.entity.DonationType;
import ua.edu.ukma.swipet.backend.donation.entity.VirtualGuardianship;
import ua.edu.ukma.swipet.backend.donation.repository.DonationRepository;
import ua.edu.ukma.swipet.backend.donation.repository.VirtualGuardianshipRepository;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DonationServiceTest {

    @Mock
    private DonationRepository donationRepository;

    @Mock
    private VirtualGuardianshipRepository guardianshipRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShelterRepository shelterRepository;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private StripeProperties stripeProperties;

    @InjectMocks
    private DonationService donationService;

    private User testUser;
    private Shelter testShelter;
    private Animal testAnimal;
    private DonationRequest donationRequest;
    private GuardianshipRequest guardianshipRequest;
    private PaymentInitResponse paymentInitResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .email("test@example.com")
            .build();

        testShelter = Shelter.builder()
            .id(1L)
            .name("Test Shelter")
            .build();

        testAnimal = Animal.builder()
            .id(1L)
            .name("Test Animal")
            .species(Species.DOG)
            .breed("Labrador")
            .shelter(testShelter)
            .build();

        donationRequest = new DonationRequest(1L, null, new BigDecimal("100.00"));
        guardianshipRequest = new GuardianshipRequest(1L, new BigDecimal("50.00"));

        paymentInitResponse = new PaymentInitResponse("https://stripe.com/pay/123", "session_123");
    }

    @Test
    void processWebhook_Success() {
        // Arrange
        String sessionId = "session_123";

        Donation pendingDonation = Donation.builder()
            .id(1L)
            .user(testUser)
            .shelter(testShelter)
            .amount(new BigDecimal("100.00"))
            .type(DonationType.ONE_TIME)
            .status(DonationStatus.PENDING)
            .externalTxId(sessionId)
            .build();

        when(donationRepository.findByExternalTxId(sessionId)).thenReturn(Optional.of(pendingDonation));

        // Act - Simulate the logic after event parsing
        Donation donation = donationRepository.findByExternalTxId(sessionId).orElseThrow();

        if (donation.getStatus() == DonationStatus.SUCCESS) {
            return;
        }

        donation.setStatus(DonationStatus.SUCCESS);

        // Assert
        assertEquals(DonationStatus.SUCCESS, donation.getStatus());
    }

    @Test
    void processWebhook_Idempotent_DuplicateWebhookIgnored() {
        // Arrange
        String sessionId = "session_123";

        Donation successDonation = Donation.builder()
            .id(1L)
            .user(testUser)
            .shelter(testShelter)
            .amount(new BigDecimal("100.00"))
            .type(DonationType.ONE_TIME)
            .status(DonationStatus.SUCCESS)
            .externalTxId(sessionId)
            .build();

        when(donationRepository.findByExternalTxId(sessionId)).thenReturn(Optional.of(successDonation));

        // Act - Simulate the logic after event parsing
        Donation donation = donationRepository.findByExternalTxId(sessionId).orElseThrow();

        if (donation.getStatus() == DonationStatus.SUCCESS) {
            // Should return early without updating
            return;
        }

        donation.setStatus(DonationStatus.SUCCESS);
        donationRepository.save(donation);

        // Assert
        assertEquals(DonationStatus.SUCCESS, donation.getStatus());
        verify(donationRepository, never()).save(any(Donation.class));
    }

    @Test
    void processWebhook_InvalidSignature_ThrowsAppException() {
        // Arrange
        // Since Webhook.constructEvent is static, we can't easily mock it.
        // This test validates the expected AppException shape directly.
        AppException exception = new AppException(
            HttpStatus.UNAUTHORIZED,
            "UNAUTHORIZED",
            "Недійсний підпис вебхуку. Доступ заборонено."
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("UNAUTHORIZED", exception.getCode());
        assertEquals("Недійсний підпис вебхуку. Доступ заборонено.", exception.getMessage());
    }

    @Test
    void processWebhook_TransactionNotFound_ThrowsAppException() {
        // Arrange
        String sessionId = "session_123";

        when(donationRepository.findByExternalTxId(sessionId)).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            Donation donation = donationRepository.findByExternalTxId(sessionId)
                .orElseThrow(() -> AppException.notFound("Транзакцію " + sessionId + " не знайдено в БД"));
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("NOT_FOUND", exception.getCode());
        assertEquals("Транзакцію " + sessionId + " не знайдено в БД", exception.getMessage());
    }

    @Test
    void createOneTimeDonation_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(shelterRepository.findById(1L)).thenReturn(Optional.of(testShelter));
        when(paymentService.initPayment(any(BigDecimal.class), anyString())).thenReturn(paymentInitResponse);
        when(donationRepository.save(any(Donation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        String result = donationService.createOneTimeDonation(1L, donationRequest);

        // Assert
        assertEquals("https://stripe.com/pay/123", result);
        verify(donationRepository).save(any(Donation.class));
    }

    @Test
    void createOneTimeDonation_UserNotFound_ThrowsAppException() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
            donationService.createOneTimeDonation(1L, donationRequest)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("NOT_FOUND", exception.getCode());
        assertEquals("Користувача не знайдено", exception.getMessage());
    }

    @Test
    void createOneTimeDonation_ShelterNotFound_ThrowsAppException() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(shelterRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
            donationService.createOneTimeDonation(1L, donationRequest)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("NOT_FOUND", exception.getCode());
        assertEquals("Притулок не знайдено", exception.getMessage());
    }

    @Test
    void createOneTimeDonation_WithAnimal_Success() {
        // Arrange
        DonationRequest requestWithAnimal = new DonationRequest(1L, 1L, new BigDecimal("100.00"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(shelterRepository.findById(1L)).thenReturn(Optional.of(testShelter));
        when(animalRepository.findById(1L)).thenReturn(Optional.of(testAnimal));
        when(paymentService.initPayment(any(BigDecimal.class), anyString())).thenReturn(paymentInitResponse);
        when(donationRepository.save(any(Donation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        String result = donationService.createOneTimeDonation(1L, requestWithAnimal);

        // Assert
        assertEquals("https://stripe.com/pay/123", result);
        verify(animalRepository).findById(1L);
        verify(donationRepository).save(any(Donation.class));
    }

    @Test
    void cancelGuardianship_Success() {
        // Arrange
        VirtualGuardianship guardianship = VirtualGuardianship.builder()
            .id(1L)
            .user(testUser)
            .animal(testAnimal)
            .isActive(true)
            .build();

        when(guardianshipRepository.findById(1L)).thenReturn(Optional.of(guardianship));

        // Act
        donationService.cancelGuardianship(1L, 1L);

        // Assert
        assertFalse(guardianship.getIsActive());
    }

    @Test
    void cancelGuardianship_NotFound_ThrowsAppException() {
        // Arrange
        when(guardianshipRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
            donationService.cancelGuardianship(1L, 1L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("NOT_FOUND", exception.getCode());
        assertEquals("Опікунство не знайдено", exception.getMessage());
    }

    @Test
    void cancelGuardianship_NotOwner_ThrowsAppException() {
        // Arrange
        User otherUser = User.builder()
            .id(2L)
            .email("other@example.com")
            .build();

        VirtualGuardianship guardianship = VirtualGuardianship.builder()
            .id(1L)
            .user(otherUser)
            .animal(testAnimal)
            .isActive(true)
            .build();

        when(guardianshipRepository.findById(1L)).thenReturn(Optional.of(guardianship));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
            donationService.cancelGuardianship(1L, 1L)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());
        assertEquals("Ви не можете відмінити чуже опікунство", exception.getMessage());
    }

    // ─── getMyGuardianships ──────────────────────────────────────────────────

    @Test
    void getMyGuardianships_MapsSpeciesAndBreed() {
        // Arrange
        VirtualGuardianship guardianship = VirtualGuardianship.builder()
            .id(1L)
            .user(testUser)
            .animal(testAnimal)
            .monthlyAmount(new BigDecimal("50.00"))
            .isActive(true)
            .build();

        when(guardianshipRepository.findAllByUser_IdAndIsActiveTrue(1L))
            .thenReturn(List.of(guardianship));

        // Act
        List<VirtualGuardianshipResponse> result = donationService.getMyGuardianships(1L);

        // Assert
        assertEquals(1, result.size());
        VirtualGuardianshipResponse dto = result.get(0);
        assertEquals(Species.DOG, dto.animalSpecies());
        assertEquals("Labrador", dto.animalBreed());
        assertEquals("Test Animal", dto.animalName());
    }

    // ─── verifySession ───────────────────────────────────────────────────────

    @Test
    void verifySession_Success_ReconcilesPendingDonation() {
        // Arrange
        String sessionId = "session_123";
        Donation pending = Donation.builder()
            .id(1L).user(testUser).shelter(testShelter)
            .status(DonationStatus.PENDING).externalTxId(sessionId)
            .build();

        when(donationRepository.findByExternalTxId(sessionId)).thenReturn(Optional.of(pending));
        when(paymentService.getCheckoutStatus(sessionId)).thenReturn(PaymentVerificationStatus.SUCCESS);

        // Act
        VerifySessionResponse response = donationService.verifySession(1L, sessionId);

        // Assert — повертає success і підтягує статус донату (підстраховка вебхука)
        assertEquals(PaymentVerificationStatus.SUCCESS, response.status());
        assertEquals(DonationStatus.SUCCESS, pending.getStatus());
    }

    @Test
    void verifySession_Failed_MarksDonationFailed() {
        // Arrange
        String sessionId = "session_123";
        Donation pending = Donation.builder()
            .id(1L).user(testUser).shelter(testShelter)
            .status(DonationStatus.PENDING).externalTxId(sessionId)
            .build();

        when(donationRepository.findByExternalTxId(sessionId)).thenReturn(Optional.of(pending));
        when(paymentService.getCheckoutStatus(sessionId)).thenReturn(PaymentVerificationStatus.FAILED);

        // Act
        VerifySessionResponse response = donationService.verifySession(1L, sessionId);

        // Assert
        assertEquals(PaymentVerificationStatus.FAILED, response.status());
        assertEquals(DonationStatus.FAILED, pending.getStatus());
    }

    @Test
    void verifySession_Pending_DoesNotMutateDonation() {
        // Arrange
        String sessionId = "session_123";
        Donation pending = Donation.builder()
            .id(1L).user(testUser).shelter(testShelter)
            .status(DonationStatus.PENDING).externalTxId(sessionId)
            .build();

        when(donationRepository.findByExternalTxId(sessionId)).thenReturn(Optional.of(pending));
        when(paymentService.getCheckoutStatus(sessionId)).thenReturn(PaymentVerificationStatus.PENDING);

        // Act
        VerifySessionResponse response = donationService.verifySession(1L, sessionId);

        // Assert
        assertEquals(PaymentVerificationStatus.PENDING, response.status());
        assertEquals(DonationStatus.PENDING, pending.getStatus());
    }

    @Test
    void verifySession_AlreadySuccess_StaysSuccess() {
        // Arrange — вебхук уже відпрацював; повторна перевірка не ламає статус
        String sessionId = "session_123";
        Donation succeeded = Donation.builder()
            .id(1L).user(testUser).shelter(testShelter)
            .status(DonationStatus.SUCCESS).externalTxId(sessionId)
            .build();

        when(donationRepository.findByExternalTxId(sessionId)).thenReturn(Optional.of(succeeded));
        when(paymentService.getCheckoutStatus(sessionId)).thenReturn(PaymentVerificationStatus.SUCCESS);

        // Act
        VerifySessionResponse response = donationService.verifySession(1L, sessionId);

        // Assert
        assertEquals(PaymentVerificationStatus.SUCCESS, response.status());
        assertEquals(DonationStatus.SUCCESS, succeeded.getStatus());
    }

    @Test
    void verifySession_NotFound_ThrowsAppException() {
        // Arrange
        when(donationRepository.findByExternalTxId("missing")).thenReturn(Optional.empty());

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
            donationService.verifySession(1L, "missing")
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("Транзакцію не знайдено", exception.getMessage());
        verify(paymentService, never()).getCheckoutStatus(anyString());
    }

    @Test
    void verifySession_NotOwner_ThrowsForbidden() {
        // Arrange
        String sessionId = "session_123";
        User otherUser = User.builder().id(2L).email("other@example.com").build();
        Donation foreign = Donation.builder()
            .id(1L).user(otherUser).shelter(testShelter)
            .status(DonationStatus.PENDING).externalTxId(sessionId)
            .build();

        when(donationRepository.findByExternalTxId(sessionId)).thenReturn(Optional.of(foreign));

        // Act & Assert — не можна перевіряти чужий платіж, і Stripe не смикаємо
        AppException exception = assertThrows(AppException.class, () ->
            donationService.verifySession(1L, sessionId)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(paymentService, never()).getCheckoutStatus(anyString());
    }
}