CREATE TABLE `products` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(36) NOT NULL,
  `category_id` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `subtitle` VARCHAR(200) NULL,
  `product_type` ENUM('STANDARD', 'BUNDLE') NOT NULL DEFAULT 'STANDARD',
  `content` TEXT NOT NULL,
  `origin` VARCHAR(100) NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT', 'ON_SALE', 'OFF_SALE') NOT NULL DEFAULT 'DRAFT',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `products_public_id_key`(`public_id`),
  INDEX `products_category_id_status_sort_order_idx`(`category_id`, `status`, `sort_order`),
  INDEX `products_status_sort_order_idx`(`status`, `sort_order`),
  PRIMARY KEY (`id`),
  CONSTRAINT `products_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_media` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT NOT NULL,
  `type` ENUM('IMAGE', 'VIDEO') NOT NULL,
  `object_key` VARCHAR(255) NOT NULL,
  `alt_text` VARCHAR(100) NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `product_media_product_id_object_key_key`(`product_id`, `object_key`),
  INDEX `product_media_product_id_sort_order_idx`(`product_id`, `sort_order`),
  PRIMARY KEY (`id`),
  CONSTRAINT `product_media_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_tags` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT NOT NULL,
  `name` VARCHAR(30) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `product_tags_product_id_name_key`(`product_id`, `name`),
  INDEX `product_tags_product_id_sort_order_idx`(`product_id`, `sort_order`),
  PRIMARY KEY (`id`),
  CONSTRAINT `product_tags_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
