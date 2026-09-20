CREATE TABLE `categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT NULL,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'DISABLED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `categories_code_key`(`code`),
  INDEX `categories_parent_id_status_sort_order_idx`(`parent_id`, `status`, `sort_order`),
  PRIMARY KEY (`id`),
  CONSTRAINT `categories_parent_id_fkey`
    FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
