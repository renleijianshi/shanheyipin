CREATE TABLE `payment_orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL, `payment_no` VARCHAR(34) NOT NULL,
  `order_id` BIGINT NOT NULL, `user_id` BIGINT NOT NULL,
  `provider` ENUM('MOCK','DISABLED','WECHAT','ALIPAY') NOT NULL,
  `status` ENUM('CREATED','PENDING','SUCCEEDED','FAILED','CLOSED','UNKNOWN') NOT NULL DEFAULT 'CREATED',
  `amount_cent` INT UNSIGNED NOT NULL, `idempotency_key` VARCHAR(128) NOT NULL,
  `request_hash` CHAR(64) NOT NULL, `provider_payment_id` VARCHAR(128) NULL,
  `client_action` JSON NULL, `failure_reason` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `payment_orders_public_id_key`(`public_id`),
  UNIQUE INDEX `payment_orders_payment_no_key`(`payment_no`),
  UNIQUE INDEX `payment_orders_user_id_idempotency_key_key`(`user_id`,`idempotency_key`),
  UNIQUE INDEX `payment_orders_provider_provider_payment_id_key`(`provider`,`provider_payment_id`),
  INDEX `payment_orders_order_id_created_at_idx`(`order_id`,`created_at`),
  INDEX `payment_orders_status_created_at_idx`(`status`,`created_at`), PRIMARY KEY (`id`),
  CONSTRAINT `payment_orders_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `payment_orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
