CREATE TABLE `aftersales` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL, `aftersale_no` VARCHAR(34) NOT NULL,
  `order_id` BIGINT NOT NULL, `user_id` BIGINT NOT NULL,
  `type` ENUM('REFUND_ONLY','RETURN_REFUND','RESHIP','COMPENSATION') NOT NULL,
  `status` ENUM('APPLIED','APPROVED','REJECTED','RETURN_PENDING','RETURN_RECEIVED','RESOLVED','CANCELLED') NOT NULL DEFAULT 'APPLIED',
  `reason` VARCHAR(100) NOT NULL, `description` VARCHAR(500) NOT NULL,
  `idempotency_key` VARCHAR(128) NOT NULL, `request_hash` CHAR(64) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `aftersales_public_id_key`(`public_id`), UNIQUE INDEX `aftersales_aftersale_no_key`(`aftersale_no`),
  UNIQUE INDEX `aftersales_user_id_idempotency_key_key`(`user_id`,`idempotency_key`),
  INDEX `aftersales_order_id_created_at_idx`(`order_id`,`created_at`), INDEX `aftersales_status_created_at_idx`(`status`,`created_at`), PRIMARY KEY (`id`),
  CONSTRAINT `aftersales_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `aftersales_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `aftersale_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `aftersale_id` BIGINT NOT NULL, `order_item_id` BIGINT NOT NULL, `quantity` TINYINT UNSIGNED NOT NULL,
  UNIQUE INDEX `aftersale_items_aftersale_id_order_item_id_key`(`aftersale_id`,`order_item_id`), INDEX `aftersale_items_order_item_id_idx`(`order_item_id`), PRIMARY KEY (`id`),
  CONSTRAINT `aftersale_items_aftersale_id_fkey` FOREIGN KEY (`aftersale_id`) REFERENCES `aftersales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `aftersale_items_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `aftersale_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `aftersale_id` BIGINT NOT NULL,
  `from_status` ENUM('APPLIED','APPROVED','REJECTED','RETURN_PENDING','RETURN_RECEIVED','RESOLVED','CANCELLED') NULL,
  `to_status` ENUM('APPLIED','APPROVED','REJECTED','RETURN_PENDING','RETURN_RECEIVED','RESOLVED','CANCELLED') NOT NULL,
  `operator_type` VARCHAR(20) NOT NULL, `operator_id` BIGINT NOT NULL, `note` VARCHAR(200) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), INDEX `aftersale_logs_aftersale_id_created_at_idx`(`aftersale_id`,`created_at`), PRIMARY KEY (`id`),
  CONSTRAINT `aftersale_logs_aftersale_id_fkey` FOREIGN KEY (`aftersale_id`) REFERENCES `aftersales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
