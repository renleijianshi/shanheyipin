CREATE TABLE `carts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(36) NOT NULL,
  `user_id` BIGINT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `carts_public_id_key`(`public_id`),
  UNIQUE INDEX `carts_user_id_key`(`user_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `carts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cart_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(36) NOT NULL,
  `cart_id` BIGINT NOT NULL,
  `sku_id` BIGINT NOT NULL,
  `quantity` TINYINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `cart_items_public_id_key`(`public_id`),
  UNIQUE INDEX `cart_items_cart_id_sku_id_key`(`cart_id`, `sku_id`),
  INDEX `cart_items_sku_id_idx`(`sku_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `cart_items_quantity_check` CHECK (`quantity` BETWEEN 1 AND 99),
  CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_items_sku_id_fkey` FOREIGN KEY (`sku_id`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
