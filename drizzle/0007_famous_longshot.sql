CREATE TABLE `user_registration_traces` (
	`auth_provider` text NOT NULL,
	`last_verified_at_iso` text NOT NULL,
	`registered_at_iso` text NOT NULL,
	`registration_email` text NOT NULL,
	`user_subject` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_registration_traces_registration_email_idx` ON `user_registration_traces` (`registration_email`);--> statement-breakpoint
CREATE INDEX `user_registration_traces_auth_provider_idx` ON `user_registration_traces` (`auth_provider`);