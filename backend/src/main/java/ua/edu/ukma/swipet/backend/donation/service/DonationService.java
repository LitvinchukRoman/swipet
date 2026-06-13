package ua.edu.ukma.swipet.backend.donation.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.edu.ukma.swipet.backend.animal.entity.Animal;
import ua.edu.ukma.swipet.backend.animal.repository.AnimalRepository;
import ua.edu.ukma.swipet.backend.auth.entity.User;
import ua.edu.ukma.swipet.backend.auth.repository.UserRepository;
import ua.edu.ukma.swipet.backend.common.exception.AppException;
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
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;

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

    /** Довільний стабільний ключ для Postgres advisory-lock крон-задачі рекурентних платежів. */
    private static final long RECURRING_LOCK_KEY = 7_345_109L;

    @Transactional
    public String createOneTimeDonation(Long userId, DonationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Користувача не знайдено"));

        Animal animal = null;
        if (request.animalId() != null) {
            animal = animalRepository.findById(request.animalId())
                    .orElseThrow(() -> AppException.notFound("Тварину не знайдено"));
        }

        // Притулок беремо явно, або (якщо донат адресовано тварині) резолвимо з неї.
        Shelter shelter;
        if (request.shelterId() != null) {
            shelter = shelterRepository.findById(request.shelterId())
                    .orElseThrow(() -> AppException.notFound("Притулок не знайдено"));
        } else if (animal != null) {
            shelter = animal.getShelter();
        } else {
            throw AppException.badRequest("Вкажіть притулок або тварину для донату");
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
                .orElseThrow(() -> AppException.notFound("Користувача не знайдено"));
        Animal animal = animalRepository.findById(request.animalId())
                .orElseThrow(() -> AppException.notFound("Тварину не знайдено"));

        if (guardianshipRepository.existsByUser_IdAndAnimal_IdAndIsActiveTrue(userId, animal.getId())) {
            throw AppException.conflict("У вас вже є активне опікунство над цією твариною");
        }

        PaymentInitResponse paymentInit = paymentService.initPayment(
                request.monthlyAmount(), 
                "Оформлення опікунства над " + animal.getName()
        );

        // Опікунство створюється НЕактивним і активується лише після підтвердження
        // активаційного платежу (externalTxId), щоб не показувати ACTIVE до оплати.
        VirtualGuardianship guardianship = VirtualGuardianship.builder()
                .user(user)
                .animal(animal)
                .monthlyAmount(request.monthlyAmount())
                .isActive(false)
                .activationTxId(paymentInit.externalTxId())
                .nextBillingAt(LocalDateTime.now().plusMonths(1))
                .build();
        guardianshipRepository.save(guardianship);

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
        Event event = paymentService.verifyWebhook(payload, sigHeader);

        if (!"checkout.session.completed".equals(event.getType())) {
            log.debug("Отримано вебхук типу {}, ігноруємо.", event.getType());
            return;
        }

        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
        if (session == null) {
            // НЕ ковтаємо тихо: кидаємо помилку (500), щоб Stripe повторив доставку.
            // Інакше донат назавжди лишився б PENDING без жодного сліду.
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "WEBHOOK_DESERIALIZE_FAILED",
                    "Не вдалося розпарсити Stripe-сесію з вебхука");
        }

        String sessionId = session.getId();

        Donation donation = donationRepository.findByExternalTxId(sessionId)
            .orElseThrow(() -> AppException.notFound("Транзакцію " + sessionId + " не знайдено в БД"));

        if (donation.getStatus() == DonationStatus.SUCCESS) {
            log.info("Транзакція {} вже була успішно оброблена раніше", sessionId);
            return;
        }

        // Не довіряємо самому факту 'completed' — асинхронні методи оплати можуть
        // завершити сесію зі статусом 'unpaid'. Зараховуємо лише реально оплачені.
        String paymentStatus = session.getPaymentStatus();
        boolean paid = "paid".equals(paymentStatus) || "no_payment_required".equals(paymentStatus);
        if (!paid) {
            log.warn("Вебхук для {} має payment_status={} — ще не оплачено, не зараховуємо", sessionId, paymentStatus);
            return;
        }

        applySuccessfulPayment(donation);
        log.info("✅ Успішно верифіковано та зараховано платіж: {} на суму {}", sessionId, donation.getAmount());
    }

    /**
     * Спільна логіка зарахування успішного платежу (вебхук + verify-session).
     * Виставляє донату SUCCESS і, для підписок, активує опікунство (активаційний
     * платіж) або посуває дату наступного списання (рекурентний платіж).
     */
    private void applySuccessfulPayment(Donation donation) {
        donation.setStatus(DonationStatus.SUCCESS);

        if (donation.getType() != DonationType.SUBSCRIPTION) {
            return;
        }

        String txId = donation.getExternalTxId();

        // 1) Активаційний платіж: опікунство прив'язане до цього session id.
        if (txId != null) {
            VirtualGuardianship activation = guardianshipRepository.findByActivationTxId(txId).orElse(null);
            if (activation != null) {
                if (!Boolean.TRUE.equals(activation.getIsActive())) {
                    Long uid = activation.getUser().getId();
                    Long aid = activation.getAnimal().getId();
                    // Не активуємо другий екземпляр, якщо активне опікунство вже є (unique-індекс).
                    if (!guardianshipRepository.existsByUser_IdAndAnimal_IdAndIsActiveTrue(uid, aid)) {
                        activation.setIsActive(true);
                        activation.setNextBillingAt(LocalDateTime.now().plusMonths(1));
                    }
                }
                return;
            }
        }

        // 2) Рекурентний платіж: посуваємо наступне списання активного опікунства.
        if (donation.getAnimal() != null) {
            guardianshipRepository
                .findFirstByUser_IdAndAnimal_IdAndIsActiveTrueOrderByIdDesc(
                        donation.getUser().getId(), donation.getAnimal().getId())
                .ifPresent(g -> g.setNextBillingAt(g.getNextBillingAt().plusMonths(1)));
        }
    }

    /**
     * Перевіряє статус Stripe Checkout Session після redirect на /payment-success.
     * Джерело істини про оплату — вебхук, але він може прийти із затримкою, тому тут
     * ми звертаємось напряму до Stripe і, якщо платіж уже пройшов, а донат у БД ще
     * PENDING, підтягуємо його статус (ідемпотентна підстраховка вебхука).
     */
    @Transactional
    public VerifySessionResponse verifySession(Long userId, String sessionId) {
        Donation donation = donationRepository.findByExternalTxId(sessionId)
                .orElseThrow(() -> AppException.notFound("Транзакцію не знайдено"));

        if (!donation.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Ви не можете перевіряти чужий платіж");
        }

        PaymentVerificationStatus status = paymentService.getCheckoutStatus(sessionId);

        if (status == PaymentVerificationStatus.SUCCESS && donation.getStatus() == DonationStatus.PENDING) {
            applySuccessfulPayment(donation);
            log.info("Підтверджено платіж {} через verify-session (вебхук ще не надійшов)", sessionId);
        } else if (status == PaymentVerificationStatus.FAILED && donation.getStatus() == DonationStatus.PENDING) {
            donation.setStatus(DonationStatus.FAILED);
            log.info("Платіж {} позначено як FAILED через verify-session", sessionId);
        }

        return VerifySessionResponse.of(status);
    }

    @Transactional
    public void cancelGuardianship(Long userId, Long guardianshipId) {
        VirtualGuardianship guardianship = guardianshipRepository.findById(guardianshipId)
                .orElseThrow(() -> AppException.notFound("Опікунство не знайдено"));

        if (!guardianship.getUser().getId().equals(userId)) {
            throw AppException.forbidden("Ви не можете відмінити чуже опікунство");
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
                g.getAnimal().getSpecies(),
                g.getAnimal().getBreed(),
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
        // Серіалізація між інстансами: лише один обробляє цикл. Advisory-lock
        // звільняється автоматично в кінці транзакції.
        if (!donationRepository.tryAdvisoryLock(RECURRING_LOCK_KEY)) {
            log.debug("Рекурентні платежі вже обробляє інший інстанс — пропускаємо цикл");
            return;
        }

        log.info("Запуск перевірки рекурентних платежів за опікунство...");
        LocalDateTime now = LocalDateTime.now();

        List<VirtualGuardianship> dueSubscriptions = guardianshipRepository.findDueSubscriptions(now);

        int created = 0;
        for (VirtualGuardianship guardianship : dueSubscriptions) {
            Long userId = guardianship.getUser().getId();
            Long animalId = guardianship.getAnimal().getId();

            // Не плодимо дублікати: якщо за цим опікунством уже висить неоплачений
            // рекурентний платіж — чекаємо на його оплату, нового не створюємо.
            if (donationRepository.existsByUser_IdAndAnimal_IdAndTypeAndStatus(
                    userId, animalId, DonationType.SUBSCRIPTION, DonationStatus.PENDING)) {
                continue;
            }

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
            created++;

            // nextBillingAt НЕ посуваємо тут — лише після фактичної оплати
            // (applySuccessfulPayment). Реальне авто-списання потребує Stripe
            // Subscriptions (TODO); поточний one-time Checkout вимагає, щоб
            // користувач оплатив згенероване посилання вручну.
        }

        if (created > 0) {
            log.info("Створено {} рекурентних платіжних сесій (очікують оплати).", created);
        }
    }
}