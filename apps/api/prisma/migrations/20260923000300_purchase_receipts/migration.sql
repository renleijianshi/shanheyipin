CREATE TABLE `purchase_receipts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(36) NOT NULL,
  `receipt_no` VARCHAR(34) NOT NULL,
  `purchase_order_id` BIGINT NOT NULL,
  `arrived_at` DATETIME(3) NOT NULL,
  `transport_status` ENUM('UNKNOWN','IN_TRANSIT','DELIVERED','EXCEPTION') NOT NULL DEFAULT 'UNKNOWN',
  `gross_weight_gram` INT UNSIGNED NULL,
  `net_weight_gram` INT UNSIGNED NULL,
  `packaging_description` VARCHAR(255) NULL,
  `note` VARCHAR(500) NULL,
  `idempotency_key` VARCHAR(128) NOT NULL,
  `request_hash` CHAR(64) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `purchase_receipts_public_id_key` (`public_id`),
  UNIQUE INDEX `purchase_receipts_receipt_no_key` (`receipt_no`),
  UNIQUE INDEX `purchase_receipts_idempotency_key_key` (`idempotency_key`),
  INDEX `purchase_receipts_purchase_order_id_arrived_at_idx` (`purchase_order_id`,`arrived_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `purchase_receipts_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `purchase_receipts_weight_check` CHECK (`gross_weight_gram` IS NULL OR `net_weight_gram` IS NULL OR `net_weight_gram` <= `gross_weight_gram`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `purchase_receipt_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `receipt_id` BIGINT NOT NULL,
  `purchase_order_item_id` BIGINT NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `gross_weight_gram` INT UNSIGNED NULL,
  `net_weight_gram` INT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `purchase_receipt_items_receipt_id_purchase_order_item_id_key` (`receipt_id`,`purchase_order_item_id`),
  INDEX `purchase_receipt_items_purchase_order_item_id_created_at_idx` (`purchase_order_item_id`,`created_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `purchase_receipt_items_receipt_id_fkey` FOREIGN KEY (`receipt_id`) REFERENCES `purchase_receipts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `purchase_receipt_items_purchase_order_item_id_fkey` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `purchase_receipt_items_quantity_check` CHECK (`quantity` > 0),
  CONSTRAINT `purchase_receipt_items_weight_check` CHECK (`gross_weight_gram` IS NULL OR `net_weight_gram` IS NULL OR `net_weight_gram` <= `gross_weight_gram`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
