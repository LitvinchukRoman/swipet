package ua.edu.ukma.swipet.backend.donation.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.donation.config.StripeProperties;
import ua.edu.ukma.swipet.backend.donation.dto.DonationRequest;
import ua.edu.ukma.swipet.backend.donation.dto.GuardianshipRequest;
import ua.edu.ukma.swipet.backend.donation.dto.PaymentInitResponse;
import ua.edu.ukma.swipet.backend.donation.dto.VirtualGuardianshipResponse;
import ua.edu.ukma.swipet.backend.donation.entity.Donation;
import ua.edu.ukma.swipet.backend.donation.entity.DonationStatus;
import ua.edu.ukma.swipet.backend.donation.entity.DonationType;
import ua.edu.ukma.swipet.backend.donation.entity.VirtualGuardianship;
import ua.edu.ukma.swipet.backend.donation.repository.DonationRepository;
import ua.edu.ukma.swipet.backend.donation.repository.VirtualGuardianshipRepository;
import ua.edu.ukma.swipet.backend.shelter.entity.Shelter;
import ua.edu.ukma.swipet.backend.shelter.repository.ShelterRepository;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.exception.SignatureVerificationException;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final VirtualGuardianshipRepository guardianshipRepository;
    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final AnimalRepository animalRepository;
    private final PaymentService paymentService;
    private final StripeProperties stripeProperties;

    @Transactional
    public String createOneTimeDonation(Long userId, DonationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));
        Shelter shelter = shelterRepository.findById(request.shelterId())
                .orElseThrow(() -> new RuntimeException("Притулок не знайдено"));
        
        Animal animal = null;
        if (request.animalId() != null) {
            animal = animalRepository.findById(request.animalId())
                    .orElseThrow(() -> new RuntimeException("Тварину не знайдено"));
        }

        String description = "Благодійний внесок для притулку " + shelter.getName();
        PaymentInitResponse paymentInit = paymentService.initPayment(request.amount(), description);

        Donation donation = Donation.builder()
                .user(user)
                .shelter(shelter)
                .animal(animal)
                .amount(request.amount())
                .type(DonationType.ONE_TIME)
                .status(DonationStatus.PENDING)
                .externalTxId(paymentInit.externalTxId())
                .build();
        
        donationRepository.save(donation);

        return paymentInit.paymentUrl();
    }

    @Transactional
    public String createGuardianship(Long userId, GuardianshipRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));
        Animal animal = animalRepository.findById(request.animalId())
                .orElseThrow(() -> new RuntimeException("Тварину не знайдено"));

        VirtualGuardianship guardianship = VirtualGuardianship.builder()
                .user(user)
                .animal(animal)
                .monthlyAmount(request.monthlyAmount())
                .isActive(true)
                .nextBillingAt(LocalDateTime.now().plusMonths(1))
                .build();
        
        guardianshipRepository.save(guardianship);

        PaymentInitResponse paymentInit = paymentService.initPayment(
                request.monthlyAmount(), 
                "Оформлення опікунства над " + animal.getName()
        );

        Donation initialDonation = Donation.builder()
                .user(user)
                .shelter(animal.getShelter())
                .animal(animal)
                .amount(request.monthlyAmount())
                .type(DonationType.SUBSCRIPTION)
                .status(DonationStatus.PENDING)
                .externalTxId(paymentInit.externalTxId())
                .build();

        donationRepository.save(initialDonation);

        return paymentInit.paymentUrl();
    }

    @Transactional
    public void processWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeProperties.webhookSecret());
        } catch (SignatureVerificationException e) {
            log.error("⚠️ Атака на вебхук або невірний підпис: {}", e.getMessage());
            throw new RuntimeException("Недійсний підпис вебхуку. Доступ заборонено.");
        }

        if ("checkout.session.completed".equals(event.getType())) {

            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session == null) return;

            String sessionId = session.getId();

            Donation donation = donationRepository.findByExternalTxId(sessionId)
                .orElseThrow(() -> new RuntimeException("Транзакцію " + sessionId + " не знайдено в БД"));

            if (donation.getStatus() == DonationStatus.SUCCESS) {
                log.info("Транзакція {} вже була успішно оброблена раніше", sessionId);
                return;
            }

            donation.setStatus(DonationStatus.SUCCESS);
            log.info("✅ Успішно верифіковано та зараховано платіж: {} на суму {}", sessionId, donation.getAmount());

        } else {
            log.debug("Отримано вебхук типу {}, ігноруємо.", event.getType());
        }
    }

    @Transactional
    public void cancelGuardianship(Long userId, Long guardianshipId) {
        VirtualGuardianship guardianship = guardianshipRepository.findById(guardianshipId)
                .orElseThrow(() -> new RuntimeException("Опікунство не знайдено"));

        if (!guardianship.getUser().getId().equals(userId)) {
            throw new RuntimeException("Ви не можете відмінити чуже опікунство");
        }

        guardianship.setIsActive(false);
    }

    @Transactional(readOnly = true)
    public List<VirtualGuardianshipResponse> getMyGuardianships(Long userId) {
        return guardianshipRepository.findAllByUser_IdAndIsActiveTrue(userId).stream()
            .map(g -> new VirtualGuardianshipResponse(
                g.getId(),
                g.getAnimal().getId(),
                g.getAnimal().getName(),
                g.getAnimal().getPrimaryPhotoUrl(),
                g.getMonthlyAmount(),
                g.getIsActive(),
                g.getStartedAt(),
                g.getNextBillingAt()
            ))
            .collect(java.util.stream.Collectors.toList());
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void processRecurringPayments() {
        log.info("Запуск перевірки рекурентних платежів за опікунство...");
        LocalDateTime now = LocalDateTime.now();

        List<VirtualGuardianship> dueSubscriptions = guardianshipRepository.findDueSubscriptions(now);

        for (VirtualGuardianship guardianship : dueSubscriptions) {
            log.info("Ініціалізація планового списання для опікунства ID: {}", guardianship.getId());

            PaymentInitResponse paymentInit = paymentService.initPayment(
                guardianship.getMonthlyAmount(),
                "Щомісячний платіж за опікунство над " + guardianship.getAnimal().getName()
            );

            Donation donation = Donation.builder()
                .user(guardianship.getUser())
                .shelter(guardianship.getAnimal().getShelter())
                .animal(guardianship.getAnimal())
                .amount(guardianship.getMonthlyAmount())
                .type(DonationType.SUBSCRIPTION)
                .status(DonationStatus.PENDING)
                .externalTxId(paymentInit.externalTxId())
                .build();

            donationRepository.save(donation);

            guardianship.setNextBillingAt(guardianship.getNextBillingAt().plusMonths(1));
        }

        if (!dueSubscriptions.isEmpty()) {
            log.info("Оброблено {} рекурентних платежів.", dueSubscriptions.size());
        }
    }
}