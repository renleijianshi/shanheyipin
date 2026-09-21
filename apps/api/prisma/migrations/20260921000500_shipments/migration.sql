ALTER TABLE `order_items` ADD COLUMN `public_id` VARCHAR(36) NULL;
UPDATE `order_items` SET `public_id` = LOWER(UUID()) WHERE `public_id` IS NULL;
ALTER TABLE `order_items` MODIFY `public_id` VARCHAR(36) NOT NULL;
CREATE UNIQUE INDEX `order_items_public_id_key` ON `order_items`(`public_id`);

CREATE TABLE `shipments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL,
  `shipment_no` VARCHAR(34) NOT NULL, `order_id` BIGINT NOT NULL, `shipped_by_admin_id` BIGINT NOT NULL,
  `idempotency_key` VARCHAR(128) NOT NULL, `request_hash` CHAR(64) NOT NULL,
  `status` ENUM('SHIPPED','IN_TRANSIT','DELIVERED','EXCEPTION') NOT NULL DEFAULT 'SHIPPED',
  `sync_status` ENUM('NOT_CONFIGURED','PENDING','SYNCED','UNKNOWN') NOT NULL DEFAULT 'NOT_CONFIGURED',
  `carrier_code` VARCHAR(32) NOT NULL, `carrier_name` VARCHAR(50) NOT NULL,
  `tracking_no` VARCHAR(64) NOT NULL, `shipped_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `delivered_at` DATETIME(3) NULL, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `shipments_public_id_key`(`public_id`), UNIQUE INDEX `shipments_shipment_no_key`(`shipment_no`),
  UNIQUE INDEX `shipments_order_id_idempotency_key_key`(`order_id`,`idempotency_key`),
  UNIQUE INDEX `shipments_carrier_code_tracking_no_key`(`carrier_code`,`tracking_no`),
  INDEX `shipments_order_id_created_at_idx`(`order_id`,`created_at`),
  INDEX `shipments_status_created_at_idx`(`status`,`created_at`),
  INDEX `shipments_shipped_by_admin_id_idx`(`shipped_by_admin_id`), PRIMARY KEY (`id`),
  CONSTRAINT `shipments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `shipments_shipped_by_admin_id_fkey` FOREIGN KEY (`shipped_by_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shipment_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `shipment_id` BIGINT NOT NULL, `order_item_id` BIGINT NOT NULL,
  `quantity` TINYINT UNSIGNED NOT NULL, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `shipment_items_shipment_id_order_item_id_key`(`shipment_id`,`order_item_id`),
  INDEX `shipment_items_order_item_id_idx`(`order_item_id`), PRIMARY KEY (`id`),
  CONSTRAINT `shipment_items_shipment_id_fkey` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `shipment_items_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
