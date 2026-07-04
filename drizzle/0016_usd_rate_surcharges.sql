ALTER TABLE `expenses` ADD `usd_rate_base` text;--> statement-breakpoint
ALTER TABLE `expenses` ADD `usd_rate_applies_iibb` integer;--> statement-breakpoint
ALTER TABLE `expenses` ADD `usd_rate_applies_iva` integer;--> statement-breakpoint
UPDATE `expenses` SET `usd_rate_base` = CASE `usd_rate_type` WHEN 'officialWithIibb' THEN 'official' ELSE `usd_rate_type` END, `usd_rate_applies_iibb` = CASE `usd_rate_type` WHEN 'officialWithIibb' THEN 1 ELSE 0 END, `usd_rate_applies_iva` = 0 WHERE `usd_rate_type` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` DROP COLUMN `usd_rate_type`;