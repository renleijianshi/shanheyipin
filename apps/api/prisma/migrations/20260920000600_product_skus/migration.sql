CREATE TABLE `product_skus` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `public_id` VARCHAR(36) NOT NULL,
  `product_id` BIGINT NOT NULL, `sku_code` VARCHAR(64) NOT NULL, `sku_name` VARCHAR(100) NOT NULL,
  `sale_price_cent` INT UNSIGNED NOT NULL, `market_price_cent` INT UNSIGNED NULL,
  `weight_gram` INT UNSIGNED NOT NULL, `barcode` VARCHAR(18) NULL,
  `sale_status` ENUM('DRAFT','ON_SALE','OFF_SALE') NOT NULL DEFAULT 'DRAFT',
  `stock_mode` ENUM('BATCH') NOT NULL DEFAULT 'BATCH', `presale_enabled` BOOLEAN NOT NULL DEFAULT false,
  `spec_signature` CHAR(64) NOT NULL, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `product_skus_public_id_key`(`public_id`), UNIQUE INDEX `product_skus_sku_code_key`(`sku_code`),
  UNIQUE INDEX `product_skus_barcode_key`(`barcode`),
  UNIQUE INDEX `product_skus_product_id_spec_signature_key`(`product_id`,`spec_signature`),
  INDEX `product_skus_product_id_sale_status_idx`(`product_id`,`sale_status`), PRIMARY KEY (`id`),
  CONSTRAINT `product_skus_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_specs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `product_id` BIGINT NOT NULL, `name` VARCHAR(30) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `product_specs_product_id_name_key`(`product_id`,`name`),
  INDEX `product_specs_product_id_sort_order_idx`(`product_id`,`sort_order`), PRIMARY KEY (`id`),
  CONSTRAINT `product_specs_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_spec_values` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `spec_id` BIGINT NOT NULL, `value` VARCHAR(50) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `product_spec_values_spec_id_value_key`(`spec_id`,`value`),
  INDEX `product_spec_values_spec_id_sort_order_idx`(`spec_id`,`sort_order`), PRIMARY KEY (`id`),
  CONSTRAINT `product_spec_values_spec_id_fkey` FOREIGN KEY (`spec_id`) REFERENCES `product_specs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sku_spec_relations` (
  `sku_id` BIGINT NOT NULL, `spec_value_id` BIGINT NOT NULL,
  PRIMARY KEY (`sku_id`,`spec_value_id`), INDEX `sku_spec_relations_spec_value_id_idx`(`spec_value_id`),
  CONSTRAINT `sku_spec_relations_sku_id_fkey` FOREIGN KEY (`sku_id`) REFERENCES `product_skus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sku_spec_relations_spec_value_id_fkey` FOREIGN KEY (`spec_value_id`) REFERENCES `product_spec_values`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
