-- Опікунство активується лише після підтвердження активаційного платежу.
-- Зберігаємо id Stripe Checkout Session цього платежу, щоб однозначно зв'язати
-- успішну оплату з конкретним опікунством (а не вгадувати за user+animal).
ALTER TABLE virtual_guardianships
    ADD COLUMN activation_tx_id VARCHAR(255);

-- Нові опікунства створюються неактивними (PENDING-оплата). Старий DEFAULT true
-- більше не відповідає логіці застосунку.
ALTER TABLE virtual_guardianships
    ALTER COLUMN is_active SET DEFAULT false;

-- Заборона дублікатів: у користувача не може бути двох АКТИВНИХ опікунств над
-- однією твариною (частковий unique-індекс рахує лише активні рядки).
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_guardianship_per_user_animal
    ON virtual_guardianships (user_id, animal_id)
    WHERE is_active = true;
