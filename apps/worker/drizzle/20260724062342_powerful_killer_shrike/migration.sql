CREATE TABLE `dns_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`type` text NOT NULL,
	`name` text NOT NULL UNIQUE,
	`content` text NOT NULL,
	`ttl` integer
);
