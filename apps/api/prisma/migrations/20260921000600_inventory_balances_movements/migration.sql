CREATE TABLE `warehouses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL, `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(100) NOT NULL, `enabled` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `warehouses_public_id_key`(`public_id`), UNIQUE INDEX `warehouses_code_key`(`code`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `inventory_batches` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL, `batch_no` VARCHAR(64) NOT NULL,
  `sku_id` BIGINT NOT NULL, `warehouse_id` BIGINT NOT NULL, `unit_cost_cent` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `inventory_batches_public_id_key`(`public_id`), UNIQUE INDEX `inventory_batches_batch_no_key`(`batch_no`),
  INDEX `inventory_batches_sku_id_warehouse_id_idx`(`sku_id`,`warehouse_id`), PRIMARY KEY (`id`),
  CONSTRAINT `inventory_batches_sku_id_fkey` FOREIGN KEY (`sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_batches_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `inventory_balances` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `sku_id` BIGINT NOT NULL, `warehouse_id` BIGINT NOT NULL, `batch_id` BIGINT NOT NULL,
  `physical_qty` INTEGER NOT NULL DEFAULT 0, `available_qty` INTEGER NOT NULL DEFAULT 0, `locked_qty` INTEGER NOT NULL DEFAULT 0,
  `outbound_qty` INTEGER NOT NULL DEFAULT 0, `frozen_qty` INTEGER NOT NULL DEFAULT 0, `defective_qty` INTEGER NOT NULL DEFAULT 0,
  `return_inspection_qty` INTEGER NOT NULL DEFAULT 0, `version` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `inventory_balances_sku_id_warehouse_id_batch_id_key`(`sku_id`,`warehouse_id`,`batch_id`),
  INDEX `inventory_balances_warehouse_id_sku_id_idx`(`warehouse_id`,`sku_id`), PRIMARY KEY (`id`),
  CONSTRAINT `inventory_balances_sku_id_fkey` FOREIGN KEY (`sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_balances_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_balances_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `inventory_movements` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL, `movement_no` VARCHAR(34) NOT NULL,
  `balance_id` BIGINT NOT NULL, `sku_id` BIGINT NOT NULL, `warehouse_id` BIGINT NOT NULL, `batch_id` BIGINT NOT NULL,
  `operator_admin_id` BIGINT NOT NULL,
  `type` ENUM('PURCHASE_IN','PURCHASE_RETURN_OUT','PROCESS_MATERIAL_OUT','PROCESS_FINISHED_IN','SALES_RESERVE','SALES_RELEASE','SALES_OUT','RETURN_IN','TRANSFER_OUT','TRANSFER_IN','STOCKTAKE_GAIN','STOCKTAKE_LOSS','DAMAGE_LOSS','MANUAL_ADJUST','RESHIP_OUT') NOT NULL,
  `source_type` VARCHAR(50) NOT NULL, `source_id` VARCHAR(36) NOT NULL, `reason` VARCHAR(200) NOT NULL,
  `idempotency_key` VARCHAR(128) NOT NULL, `request_hash` CHAR(64) NOT NULL,
  `deltas` JSON NOT NULL, `before_quantities` JSON NOT NULL, `after_quantities` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `inventory_movements_public_id_key`(`public_id`), UNIQUE INDEX `inventory_movements_movement_no_key`(`movement_no`),
  UNIQUE INDEX `inventory_movements_idempotency_key_key`(`idempotency_key`), INDEX `inventory_movements_sku_id_created_at_idx`(`sku_id`,`created_at`),
  INDEX `inventory_movements_source_type_source_id_idx`(`source_type`,`source_id`), INDEX `inventory_movements_operator_admin_id_idx`(`operator_admin_id`), PRIMARY KEY (`id`),
  CONSTRAINT `inventory_movements_balance_id_fkey` FOREIGN KEY (`balance_id`) REFERENCES `inventory_balances`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_sku_id_fkey` FOREIGN KEY (`sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_operator_admin_id_fkey` FOREIGN KEY (`operator_admin_id`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
