CREATE TABLE `ayat` (
	`key` text PRIMARY KEY NOT NULL,
	`surah` integer NOT NULL,
	`ayah` integer NOT NULL,
	`text` text NOT NULL,
	`basmalah` text,
	`juz` integer NOT NULL,
	`page` integer NOT NULL,
	`edition_id` text NOT NULL,
	`checksum` text NOT NULL,
	`normalized` text NOT NULL,
	FOREIGN KEY (`surah`) REFERENCES `surahs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ayat_surah_ayah` ON `ayat` (`surah`,`ayah`);--> statement-breakpoint
CREATE INDEX `ayat_juz` ON `ayat` (`juz`);--> statement-breakpoint
CREATE TABLE `citations` (
	`id` text PRIMARY KEY NOT NULL,
	`edition_id` text NOT NULL,
	`locator` text NOT NULL,
	`exact_text` text NOT NULL,
	`span` text,
	`url` text NOT NULL,
	`checksum` text NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `claims` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`wording` text NOT NULL,
	`kind` text NOT NULL,
	`evidence_ids` text NOT NULL,
	`review` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `research_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `display_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`surah` integer NOT NULL,
	`section` text NOT NULL,
	`images` text NOT NULL,
	`source_url` text NOT NULL,
	`start_ayah` integer,
	`end_ayah` integer
);
--> statement-breakpoint
CREATE TABLE `editions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`version` text NOT NULL,
	`retrieved` text NOT NULL,
	`checksum` text NOT NULL,
	`status` text NOT NULL,
	`count` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`metadata` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `gradings` (
	`id` text PRIMARY KEY NOT NULL,
	`hadith_id` text NOT NULL,
	`grade` text NOT NULL,
	`attributed_to` text NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`hadith_id`) REFERENCES `hadith`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hadith` (
	`id` text PRIMARY KEY NOT NULL,
	`edition_id` text NOT NULL,
	`title` text NOT NULL,
	`arabic` text NOT NULL,
	`attribution` text NOT NULL,
	`reference` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `import_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`started` text NOT NULL,
	`completed` text,
	`status` text NOT NULL,
	`report` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notebooks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `numbering_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`hadith_id` text NOT NULL,
	`collection` text NOT NULL,
	`number` text NOT NULL,
	`scheme` text NOT NULL,
	`url` text NOT NULL,
	`verification` text NOT NULL,
	FOREIGN KEY (`hadith_id`) REFERENCES `hadith`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `passages` (
	`id` text PRIMARY KEY NOT NULL,
	`edition_id` text NOT NULL,
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`surah` integer,
	`ayah` integer,
	`language` text NOT NULL,
	`text` text NOT NULL,
	`footnotes` text NOT NULL,
	`checksum` text NOT NULL,
	`url` text NOT NULL,
	`normalized` text NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `passages_surah_language_kind` ON `passages` (`surah`,`language`,`kind`);--> statement-breakpoint
CREATE INDEX `passages_key` ON `passages` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `passages_edition_key` ON `passages` (`edition_id`,`key`);--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`evidence_id` text NOT NULL,
	`type` text NOT NULL,
	`provenance` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `research_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`query` text NOT NULL,
	`created` text NOT NULL,
	`status` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`reviewer` text NOT NULL,
	`scope` text NOT NULL,
	`evidence_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`old_edition` text NOT NULL,
	`new_edition` text NOT NULL,
	`changed_keys` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`author` text NOT NULL,
	`publisher` text NOT NULL,
	`language` text NOT NULL,
	`url` text NOT NULL,
	`terms` text NOT NULL,
	`scope` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `surahs` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`arabic` text NOT NULL,
	`meaning` text NOT NULL,
	`count` integer NOT NULL,
	`revelation` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tafsir_ranges` (
	`id` text PRIMARY KEY NOT NULL,
	`passage_id` text NOT NULL,
	`start_key` text NOT NULL,
	`end_key` text NOT NULL,
	FOREIGN KEY (`passage_id`) REFERENCES `passages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`start_key`) REFERENCES `ayat`(`key`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`end_key`) REFERENCES `ayat`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `talks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`language` text NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topic_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`language` text NOT NULL,
	`alias` text NOT NULL,
	`provenance` text NOT NULL
);
