DROP INDEX `passages_edition_key`;--> statement-breakpoint
CREATE UNIQUE INDEX `passages_edition_key` ON `passages` (`edition_id`,`key`,`language`);