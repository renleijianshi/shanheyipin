CREATE TABLE `user_addresses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT, `user_id` BIGINT NOT NULL,
  `recipient_name` VARCHAR(50) NOT NULL, `phone` VARCHAR(20) NOT NULL,
  `province` VARCHAR(50) NOT NULL, `city` VARCHAR(50) NOT NULL,
  `district` VARCHAR(50) NOT NULL, `detail` VARCHAR(255) NOT NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `user_addresses_user_id_is_default_idx`(`user_id`, `is_default`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `user_addresses` ADD CONSTRAINT `user_addresses_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
