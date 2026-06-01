ALTER TABLE `portfolio_items` MODIFY COLUMN `type` enum('us-stock','kr-stock','etf','commodity','savings','note') NOT NULL DEFAULT 'us-stock';--> statement-breakpoint
ALTER TABLE `portfolio_items` MODIFY COLUMN `accountType` varchar(50) NOT NULL DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `principal_records` MODIFY COLUMN `accountType` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolio_items` ADD `maturityDate` varchar(10);--> statement-breakpoint
ALTER TABLE `portfolio_items` ADD `interestRate` double;