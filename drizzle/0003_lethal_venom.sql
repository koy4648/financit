CREATE TABLE `fx_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`type` enum('buy','sell') NOT NULL DEFAULT 'buy',
	`exchangeRate` double NOT NULL,
	`usdAmount` double NOT NULL,
	`krwAmount` int NOT NULL,
	`memo` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fx_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `principal_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`accountType` enum('isa','pension','irp','general') NOT NULL,
	`amount` int NOT NULL,
	`memo` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `principal_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `realized_gains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`market` enum('kr','us') NOT NULL DEFAULT 'kr',
	`buyDate` varchar(10) NOT NULL,
	`sellDate` varchar(10) NOT NULL,
	`ticker` varchar(20),
	`name` varchar(100) NOT NULL,
	`buyPrice` double NOT NULL,
	`sellPrice` double NOT NULL,
	`shares` double NOT NULL,
	`dividendTotal` double NOT NULL DEFAULT 0,
	`currency` enum('KRW','USD') NOT NULL DEFAULT 'KRW',
	`memo` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `realized_gains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `portfolio_items` ADD `accountType` enum('isa','pension','irp','general') DEFAULT 'general' NOT NULL;