CREATE TABLE `payment_transactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL,
  `payment_order_id` BIGINT NOT NULL, `provider` ENUM('MOCK','DISABLED','WECHAT','ALIPAY') NOT NULL,
  `event_id` VARCHAR(128) NOT NULL, `provider_payment_id` VARCHAR(128) NOT NULL,
  `status` ENUM('SUCCEEDED') NOT NULL, `amount_cent` INT UNSIGNED NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `payment_transactions_public_id_key`(`public_id`),
  UNIQUE INDEX `payment_transactions_provider_event_id_key`(`provider`,`event_id`),
  UNIQUE INDEX `payment_transactions_provider_provider_payment_id_key`(`provider`,`provider_payment_id`),
  INDEX `payment_transactions_payment_order_id_created_at_idx`(`payment_order_id`,`created_at`), PRIMARY KEY (`id`),
  CONSTRAINT `payment_transactions_payment_order_id_fkey` FOREIGN KEY (`payment_order_id`) REFERENCES `payment_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
