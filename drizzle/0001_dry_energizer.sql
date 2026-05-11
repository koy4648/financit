CREATE TABLE `buy_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`portfolioItemId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`price` double NOT NULL,
	`amount` int NOT NULL,
	`shares` double NOT NULL,
	`exchangeRate` double,
	`memo` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buy_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticker` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameKr` varchar(100),
	`type` enum('us-stock','kr-stock','etf','commodity') NOT NULL DEFAULT 'us-stock',
	`currency` enum('KRW','USD') NOT NULL DEFAULT 'USD',
	`avgCost` double NOT NULL DEFAULT 0,
	`shares` double NOT NULL DEFAULT 0,
	`buyAmount` int NOT NULL DEFAULT 1000,
	`buyFrequency` enum('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
	`sector` varchar(100),
	`memo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_items_id` PRIMARY KEY(`id`)
);
