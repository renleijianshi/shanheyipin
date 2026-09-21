CREATE TABLE `orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL, `order_no` VARCHAR(34) NOT NULL,
  `user_id` BIGINT NOT NULL, `idempotency_key` VARCHAR(128) NOT NULL, `request_hash` CHAR(64) NOT NULL,
  `order_type` ENUM('STANDARD') NOT NULL DEFAULT 'STANDARD',
  `order_status` ENUM('CREATED','PAID','ALLOCATING','WAIT_SHIP','SHIPPED','RECEIVED','COMPLETED','CANCELLED','AFTERSALE','REFUNDED') NOT NULL DEFAULT 'CREATED',
  `payment_status` ENUM('UNPAID','PAYING','PAID','PAY_FAILED','PART_REFUNDED','REFUNDED','CLOSED') NOT NULL DEFAULT 'UNPAID',
  `fulfillment_status` ENUM('UNFULFILLED','ALLOCATING','WAIT_SHIP','SHIPPED','RECEIVED') NOT NULL DEFAULT 'UNFULFILLED',
  `aftersale_status` ENUM('NONE','PROCESSING','COMPLETED') NOT NULL DEFAULT 'NONE',
  `goods_amount_cent` INT UNSIGNED NOT NULL, `discount_amount_cent` INT UNSIGNED NOT NULL DEFAULT 0,
  `freight_amount_cent` INT UNSIGNED NOT NULL, `payable_amount_cent` INT UNSIGNED NOT NULL,
  `paid_amount_cent` INT UNSIGNED NOT NULL DEFAULT 0, `paid_at` DATETIME(3) NULL,
  `shipped_at` DATETIME(3) NULL, `completed_at` DATETIME(3) NULL, `cancelled_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `orders_public_id_key`(`public_id`), UNIQUE INDEX `orders_order_no_key`(`order_no`),
  UNIQUE INDEX `orders_user_id_idempotency_key_key`(`user_id`,`idempotency_key`),
  INDEX `orders_user_id_created_at_idx`(`user_id`,`created_at`),
  INDEX `orders_order_status_created_at_idx`(`order_status`,`created_at`), PRIMARY KEY (`id`),
  CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `order_id` BIGINT NOT NULL, `product_id` BIGINT NOT NULL, `sku_id` BIGINT NOT NULL,
  `product_name_snapshot` VARCHAR(100) NOT NULL, `sku_name_snapshot` VARCHAR(100) NOT NULL,
  `image_snapshot` VARCHAR(255) NULL, `specs_snapshot` JSON NOT NULL,
  `unit_price_cent` INT UNSIGNED NOT NULL, `quantity` TINYINT UNSIGNED NOT NULL,
  `discount_cent` INT UNSIGNED NOT NULL DEFAULT 0, `final_amount_cent` INT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `order_items_order_id_idx`(`order_id`), INDEX `order_items_sku_id_idx`(`sku_id`), PRIMARY KEY (`id`),
  CONSTRAINT `order_items_quantity_check` CHECK (`quantity` BETWEEN 1 AND 99),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_items_sku_id_fkey` FOREIGN KEY (`sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_addresses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `order_id` BIGINT NOT NULL, `recipient_name` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(20) NOT NULL, `province` VARCHAR(50) NOT NULL, `city` VARCHAR(50) NOT NULL,
  `district` VARCHAR(50) NOT NULL, `detail` VARCHAR(255) NOT NULL,
  UNIQUE INDEX `order_addresses_order_id_key`(`order_id`), PRIMARY KEY (`id`),
  CONSTRAINT `order_addresses_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_price_details` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `order_id` BIGINT NOT NULL,
  `type` ENUM('GOODS','PROMOTION','COUPON','MEMBER','POINTS','FREIGHT','ADJUSTMENT','PAYABLE') NOT NULL,
  `description` VARCHAR(100) NOT NULL, `amount_cent` INT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `order_price_details_order_id_idx`(`order_id`), PRIMARY KEY (`id`),
  CONSTRAINT `order_price_details_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_status_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `order_id` BIGINT NOT NULL,
  `from_status` ENUM('CREATED','PAID','ALLOCATING','WAIT_SHIP','SHIPPED','RECEIVED','COMPLETED','CANCELLED','AFTERSALE','REFUNDED') NULL,
  `to_status` ENUM('CREATED','PAID','ALLOCATING','WAIT_SHIP','SHIPPED','RECEIVED','COMPLETED','CANCELLED','AFTERSALE','REFUNDED') NOT NULL,
  `reason` VARCHAR(200) NOT NULL, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `order_status_logs_order_id_created_at_idx`(`order_id`,`created_at`), PRIMARY KEY (`id`),
  CONSTRAINT `order_status_logs_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
