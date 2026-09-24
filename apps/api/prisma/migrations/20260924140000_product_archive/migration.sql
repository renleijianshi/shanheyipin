-- Reversible logical removal: historical product and order relations remain intact.
ALTER TABLE `products` ADD COLUMN `archived_at` DATETIME(3) NULL;
