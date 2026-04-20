CREATE TABLE `monthly_expense_months` (
	`exchange_rate_blue_rate` real,
	`exchange_rate_month` text,
	`exchange_rate_official_rate` real,
	`exchange_rate_solidarity_rate` real,
	`month` text NOT NULL,
	`updated_at_iso` text NOT NULL,
	`user_subject` text NOT NULL,
	PRIMARY KEY(`user_subject`, `month`)
);
--> statement-breakpoint
INSERT INTO `monthly_expense_months` (
	`exchange_rate_blue_rate`,
	`exchange_rate_month`,
	`exchange_rate_official_rate`,
	`exchange_rate_solidarity_rate`,
	`month`,
	`updated_at_iso`,
	`user_subject`
)
SELECT
	MAX(`exchange_rate_blue_rate`),
	MAX(`exchange_rate_month`),
	MAX(`exchange_rate_official_rate`),
	MAX(`exchange_rate_solidarity_rate`),
	`month`,
	MAX(`updated_at_iso`),
	`user_subject`
FROM `expense_months`
GROUP BY `user_subject`, `month`
ON CONFLICT(`user_subject`, `month`) DO UPDATE SET
	`exchange_rate_blue_rate` = excluded.`exchange_rate_blue_rate`,
	`exchange_rate_month` = excluded.`exchange_rate_month`,
	`exchange_rate_official_rate` = excluded.`exchange_rate_official_rate`,
	`exchange_rate_solidarity_rate` = excluded.`exchange_rate_solidarity_rate`,
	`updated_at_iso` = excluded.`updated_at_iso`;
--> statement-breakpoint
INSERT INTO `monthly_expense_months` (
	`exchange_rate_blue_rate`,
	`exchange_rate_month`,
	`exchange_rate_official_rate`,
	`exchange_rate_solidarity_rate`,
	`month`,
	`updated_at_iso`,
	`user_subject`
)
SELECT
	json_extract(`payload_json`, '$.exchangeRateSnapshot.blueRate'),
	json_extract(`payload_json`, '$.exchangeRateSnapshot.month'),
	json_extract(`payload_json`, '$.exchangeRateSnapshot.officialRate'),
	json_extract(`payload_json`, '$.exchangeRateSnapshot.solidarityRate'),
	`month`,
	`updated_at_iso`,
	`user_subject`
FROM `monthly_expenses_documents`
WHERE true
ON CONFLICT(`user_subject`, `month`) DO UPDATE SET
	`exchange_rate_blue_rate` = excluded.`exchange_rate_blue_rate`,
	`exchange_rate_month` = excluded.`exchange_rate_month`,
	`exchange_rate_official_rate` = excluded.`exchange_rate_official_rate`,
	`exchange_rate_solidarity_rate` = excluded.`exchange_rate_solidarity_rate`,
	`updated_at_iso` = excluded.`updated_at_iso`;
--> statement-breakpoint
DELETE FROM `expense_payment_records`
WHERE EXISTS (
	SELECT 1
	FROM `monthly_expenses_documents`
	WHERE `monthly_expenses_documents`.`user_subject` = `expense_payment_records`.`user_subject`
		AND `monthly_expenses_documents`.`month` = `expense_payment_records`.`month`
);
--> statement-breakpoint
DELETE FROM `expense_receipts`
WHERE EXISTS (
	SELECT 1
	FROM `monthly_expenses_documents`
	WHERE `monthly_expenses_documents`.`user_subject` = `expense_receipts`.`user_subject`
		AND `monthly_expenses_documents`.`month` = `expense_receipts`.`month`
);
--> statement-breakpoint
DELETE FROM `expense_months`
WHERE EXISTS (
	SELECT 1
	FROM `monthly_expenses_documents`
	WHERE `monthly_expenses_documents`.`user_subject` = `expense_months`.`user_subject`
		AND `monthly_expenses_documents`.`month` = `expense_months`.`month`
);
--> statement-breakpoint
WITH `legacy_items` AS (
	SELECT
		`monthly_expenses_documents`.`user_subject`,
		`monthly_expenses_documents`.`month`,
		`monthly_expenses_documents`.`updated_at_iso`,
		CAST(`item`.`key` AS integer) AS `item_index`,
		`item`.`value` AS `item_json`,
		json_extract(`item`.`value`, '$.id') AS `original_expense_id`,
		COUNT(*) OVER (
			PARTITION BY
				`monthly_expenses_documents`.`user_subject`,
				`monthly_expenses_documents`.`month`,
				json_extract(`item`.`value`, '$.id')
		) AS `same_expense_id_count`
	FROM `monthly_expenses_documents`, json_each(`monthly_expenses_documents`.`payload_json`, '$.items') AS `item`
),
`normalized_items` AS (
	SELECT
		`user_subject`,
		`month`,
		`updated_at_iso`,
		`item_index`,
		`item_json`,
		CASE
			WHEN `same_expense_id_count` > 1 THEN 'legacy:' || `user_subject` || ':' || `month` || ':' || `original_expense_id` || ':' || `item_index`
			ELSE `original_expense_id`
		END AS `expense_id`
	FROM `legacy_items`
)
INSERT INTO `expenses` (
	`all_receipts_folder_id`,
	`all_receipts_folder_view_url`,
	`created_at_iso`,
	`currency`,
	`description`,
	`expense_id`,
	`loan_installment_count`,
	`loan_lender_id`,
	`loan_lender_name`,
	`loan_start_month`,
	`payment_link`,
	`receipt_share_message`,
	`receipt_share_phone_digits`,
	`requires_receipt_share`,
	`updated_at_iso`,
	`user_subject`
)
SELECT
	CASE
		WHEN NULLIF(json_extract(`item_json`, '$.folders.allReceiptsFolderId'), '') IS NOT NULL
			AND NULLIF(json_extract(`item_json`, '$.folders.allReceiptsFolderViewUrl'), '') IS NOT NULL
			THEN json_extract(`item_json`, '$.folders.allReceiptsFolderId')
		ELSE COALESCE(
			json_extract(`item_json`, '$.receipts[0].allReceiptsFolderId'),
			json_extract(`item_json`, '$.receipt.folderId'),
			json_extract(`item_json`, '$.paymentRecords[0].receipt.allReceiptsFolderId')
		)
	END,
	CASE
		WHEN NULLIF(json_extract(`item_json`, '$.folders.allReceiptsFolderId'), '') IS NOT NULL
			AND NULLIF(json_extract(`item_json`, '$.folders.allReceiptsFolderViewUrl'), '') IS NOT NULL
			THEN json_extract(`item_json`, '$.folders.allReceiptsFolderViewUrl')
		ELSE COALESCE(
			json_extract(`item_json`, '$.receipts[0].allReceiptsFolderViewUrl'),
			json_extract(`item_json`, '$.receipt.folderViewUrl'),
			json_extract(`item_json`, '$.paymentRecords[0].receipt.allReceiptsFolderViewUrl')
		)
	END,
	strftime('%Y-%m-%dT%H:%M:%fZ', julianday(`updated_at_iso`) + (`item_index` / 86400000.0)),
	json_extract(`item_json`, '$.currency'),
	json_extract(`item_json`, '$.description'),
	`expense_id`,
	json_extract(`item_json`, '$.loan.installmentCount'),
	json_extract(`item_json`, '$.loan.lenderId'),
	json_extract(`item_json`, '$.loan.lenderName'),
	json_extract(`item_json`, '$.loan.startMonth'),
	json_extract(`item_json`, '$.paymentLink'),
	json_extract(`item_json`, '$.receiptShareMessage'),
	json_extract(`item_json`, '$.receiptSharePhoneDigits'),
	CASE WHEN json_extract(`item_json`, '$.requiresReceiptShare') = 1 THEN 1 ELSE 0 END,
	`updated_at_iso`,
	`user_subject`
FROM `normalized_items`
WHERE true
ON CONFLICT(`user_subject`, `expense_id`) DO UPDATE SET
	`all_receipts_folder_id` = excluded.`all_receipts_folder_id`,
	`all_receipts_folder_view_url` = excluded.`all_receipts_folder_view_url`,
	`currency` = excluded.`currency`,
	`description` = excluded.`description`,
	`loan_installment_count` = excluded.`loan_installment_count`,
	`loan_lender_id` = excluded.`loan_lender_id`,
	`loan_lender_name` = excluded.`loan_lender_name`,
	`loan_start_month` = excluded.`loan_start_month`,
	`payment_link` = excluded.`payment_link`,
	`receipt_share_message` = excluded.`receipt_share_message`,
	`receipt_share_phone_digits` = excluded.`receipt_share_phone_digits`,
	`requires_receipt_share` = excluded.`requires_receipt_share`,
	`updated_at_iso` = excluded.`updated_at_iso`;
--> statement-breakpoint
WITH `legacy_items` AS (
	SELECT
		`monthly_expenses_documents`.`user_subject`,
		`monthly_expenses_documents`.`month`,
		`monthly_expenses_documents`.`updated_at_iso`,
		CAST(`item`.`key` AS integer) AS `item_index`,
		`item`.`value` AS `item_json`,
		json_extract(`item`.`value`, '$.id') AS `original_expense_id`,
		COUNT(*) OVER (
			PARTITION BY
				`monthly_expenses_documents`.`user_subject`,
				`monthly_expenses_documents`.`month`,
				json_extract(`item`.`value`, '$.id')
		) AS `same_expense_id_count`
	FROM `monthly_expenses_documents`, json_each(`monthly_expenses_documents`.`payload_json`, '$.items') AS `item`
),
`normalized_items` AS (
	SELECT
		`user_subject`,
		`month`,
		`updated_at_iso`,
		`item_index`,
		`item_json`,
		CASE
			WHEN `same_expense_id_count` > 1 THEN 'legacy:' || `user_subject` || ':' || `month` || ':' || `original_expense_id` || ':' || `item_index`
			ELSE `original_expense_id`
		END AS `expense_id`,
		CASE
			WHEN COALESCE(json_array_length(`item_json`, '$.paymentRecords'), 0) > 0 THEN (
				SELECT COALESCE(SUM(
					CASE
						WHEN json_type(`payment_record`.`value`, '$.receipt') IS NULL
							OR json_type(`payment_record`.`value`, '$.receipt') = 'null'
							THEN json_extract(`payment_record`.`value`, '$.coveredPayments')
						ELSE 0
					END
				), 0)
				FROM json_each(`item_json`, '$.paymentRecords') AS `payment_record`
			)
			ELSE COALESCE(
				json_extract(`item_json`, '$.manualCoveredPayments'),
				CASE
					WHEN json_extract(`item_json`, '$.isPaid') = 1
						AND COALESCE(json_array_length(`item_json`, '$.receipts'), 0) = 0
						AND json_type(`item_json`, '$.receipt') IS NULL
						THEN json_extract(`item_json`, '$.occurrencesPerMonth')
					ELSE 0
				END
			)
		END AS `manual_covered_payments`,
		CASE
			WHEN COALESCE(json_array_length(`item_json`, '$.paymentRecords'), 0) > 0 THEN (
				SELECT COALESCE(SUM(json_extract(`payment_record`.`value`, '$.coveredPayments')), 0)
				FROM json_each(`item_json`, '$.paymentRecords') AS `payment_record`
			)
			ELSE (
				COALESCE(
					json_extract(`item_json`, '$.manualCoveredPayments'),
					CASE
						WHEN json_extract(`item_json`, '$.isPaid') = 1
							AND COALESCE(json_array_length(`item_json`, '$.receipts'), 0) = 0
							AND json_type(`item_json`, '$.receipt') IS NULL
							THEN json_extract(`item_json`, '$.occurrencesPerMonth')
						ELSE 0
					END
				)
				+ (
					SELECT COALESCE(SUM(COALESCE(json_extract(`receipt`.`value`, '$.coveredPayments'), 1)), 0)
					FROM json_each(`item_json`, '$.receipts') AS `receipt`
				)
				+ CASE WHEN json_type(`item_json`, '$.receipt') = 'object' THEN 1 ELSE 0 END
			)
		END AS `covered_payments`
	FROM `legacy_items`
)
INSERT INTO `expense_months` (
	`exchange_rate_month`,
	`exchange_rate_blue_rate`,
	`exchange_rate_official_rate`,
	`exchange_rate_solidarity_rate`,
	`expense_id`,
	`is_paid`,
	`manual_covered_payments`,
	`month`,
	`monthly_folder_id`,
	`monthly_folder_view_url`,
	`occurrences_per_month`,
	`receipt_share_status`,
	`subtotal`,
	`updated_at_iso`,
	`user_subject`
)
SELECT
	json_extract(`monthly_expenses_documents`.`payload_json`, '$.exchangeRateSnapshot.month'),
	json_extract(`monthly_expenses_documents`.`payload_json`, '$.exchangeRateSnapshot.blueRate'),
	json_extract(`monthly_expenses_documents`.`payload_json`, '$.exchangeRateSnapshot.officialRate'),
	json_extract(`monthly_expenses_documents`.`payload_json`, '$.exchangeRateSnapshot.solidarityRate'),
	`normalized_items`.`expense_id`,
	CASE
		WHEN `normalized_items`.`covered_payments` >= json_extract(`normalized_items`.`item_json`, '$.occurrencesPerMonth') THEN 1
		ELSE 0
	END,
	COALESCE(`normalized_items`.`manual_covered_payments`, 0),
	`normalized_items`.`month`,
	CASE
		WHEN NULLIF(json_extract(`normalized_items`.`item_json`, '$.folders.monthlyFolderId'), '') IS NOT NULL
			AND NULLIF(json_extract(`normalized_items`.`item_json`, '$.folders.monthlyFolderViewUrl'), '') IS NOT NULL
			THEN json_extract(`normalized_items`.`item_json`, '$.folders.monthlyFolderId')
		ELSE COALESCE(
			json_extract(`normalized_items`.`item_json`, '$.receipts[0].monthlyFolderId'),
			json_extract(`normalized_items`.`item_json`, '$.receipt.folderId'),
			json_extract(`normalized_items`.`item_json`, '$.paymentRecords[0].receipt.monthlyFolderId')
		)
	END,
	CASE
		WHEN NULLIF(json_extract(`normalized_items`.`item_json`, '$.folders.monthlyFolderId'), '') IS NOT NULL
			AND NULLIF(json_extract(`normalized_items`.`item_json`, '$.folders.monthlyFolderViewUrl'), '') IS NOT NULL
			THEN json_extract(`normalized_items`.`item_json`, '$.folders.monthlyFolderViewUrl')
		ELSE COALESCE(
			json_extract(`normalized_items`.`item_json`, '$.receipts[0].monthlyFolderViewUrl'),
			json_extract(`normalized_items`.`item_json`, '$.receipt.folderViewUrl'),
			json_extract(`normalized_items`.`item_json`, '$.paymentRecords[0].receipt.monthlyFolderViewUrl')
		)
	END,
	json_extract(`normalized_items`.`item_json`, '$.occurrencesPerMonth'),
	json_extract(`normalized_items`.`item_json`, '$.receiptShareStatus'),
	json_extract(`normalized_items`.`item_json`, '$.subtotal'),
	`normalized_items`.`updated_at_iso`,
	`normalized_items`.`user_subject`
FROM `normalized_items`
INNER JOIN `monthly_expenses_documents`
	ON `monthly_expenses_documents`.`user_subject` = `normalized_items`.`user_subject`
	AND `monthly_expenses_documents`.`month` = `normalized_items`.`month`
WHERE true
ON CONFLICT(`user_subject`, `expense_id`, `month`) DO UPDATE SET
	`exchange_rate_month` = excluded.`exchange_rate_month`,
	`exchange_rate_blue_rate` = excluded.`exchange_rate_blue_rate`,
	`exchange_rate_official_rate` = excluded.`exchange_rate_official_rate`,
	`exchange_rate_solidarity_rate` = excluded.`exchange_rate_solidarity_rate`,
	`is_paid` = excluded.`is_paid`,
	`manual_covered_payments` = excluded.`manual_covered_payments`,
	`monthly_folder_id` = excluded.`monthly_folder_id`,
	`monthly_folder_view_url` = excluded.`monthly_folder_view_url`,
	`occurrences_per_month` = excluded.`occurrences_per_month`,
	`receipt_share_status` = excluded.`receipt_share_status`,
	`subtotal` = excluded.`subtotal`,
	`updated_at_iso` = excluded.`updated_at_iso`;
--> statement-breakpoint
WITH `legacy_items` AS (
	SELECT
		`monthly_expenses_documents`.`user_subject`,
		`monthly_expenses_documents`.`month`,
		CAST(`item`.`key` AS integer) AS `item_index`,
		`item`.`value` AS `item_json`,
		json_extract(`item`.`value`, '$.id') AS `original_expense_id`,
		COUNT(*) OVER (
			PARTITION BY
				`monthly_expenses_documents`.`user_subject`,
				`monthly_expenses_documents`.`month`,
				json_extract(`item`.`value`, '$.id')
		) AS `same_expense_id_count`
	FROM `monthly_expenses_documents`, json_each(`monthly_expenses_documents`.`payload_json`, '$.items') AS `item`
),
`normalized_items` AS (
	SELECT
		`user_subject`,
		`month`,
		`item_json`,
		CASE
			WHEN `same_expense_id_count` > 1 THEN 'legacy:' || `user_subject` || ':' || `month` || ':' || `original_expense_id` || ':' || `item_index`
			ELSE `original_expense_id`
		END AS `expense_id`
	FROM `legacy_items`
),
`receipt_rows` AS (
	SELECT
		`normalized_items`.`user_subject`,
		`normalized_items`.`month`,
		`normalized_items`.`expense_id`,
		json_extract(`receipt`.`value`, '$.allReceiptsFolderId') AS `all_receipts_folder_id`,
		json_extract(`receipt`.`value`, '$.allReceiptsFolderViewUrl') AS `all_receipts_folder_view_url`,
		COALESCE(json_extract(`receipt`.`value`, '$.coveredPayments'), 1) AS `covered_payments`,
		json_extract(`receipt`.`value`, '$.fileId') AS `file_id`,
		json_extract(`receipt`.`value`, '$.fileName') AS `file_name`,
		json_extract(`receipt`.`value`, '$.fileViewUrl') AS `file_view_url`,
		json_extract(`receipt`.`value`, '$.monthlyFolderId') AS `monthly_folder_id`,
		json_extract(`receipt`.`value`, '$.monthlyFolderViewUrl') AS `monthly_folder_view_url`,
		json_extract(`receipt`.`value`, '$.registeredAt') AS `registered_at_iso`
	FROM `normalized_items`, json_each(`normalized_items`.`item_json`, '$.receipts') AS `receipt`
	UNION ALL
	SELECT
		`user_subject`,
		`month`,
		`expense_id`,
		json_extract(`item_json`, '$.receipt.folderId'),
		json_extract(`item_json`, '$.receipt.folderViewUrl'),
		1,
		json_extract(`item_json`, '$.receipt.fileId'),
		json_extract(`item_json`, '$.receipt.fileName'),
		json_extract(`item_json`, '$.receipt.fileViewUrl'),
		json_extract(`item_json`, '$.receipt.folderId'),
		json_extract(`item_json`, '$.receipt.folderViewUrl'),
		NULL
	FROM `normalized_items`
	WHERE json_type(`item_json`, '$.receipt') = 'object'
	UNION ALL
	SELECT
		`normalized_items`.`user_subject`,
		`normalized_items`.`month`,
		`normalized_items`.`expense_id`,
		json_extract(`payment_record`.`value`, '$.receipt.allReceiptsFolderId'),
		json_extract(`payment_record`.`value`, '$.receipt.allReceiptsFolderViewUrl'),
		COALESCE(json_extract(`payment_record`.`value`, '$.receipt.coveredPayments'), json_extract(`payment_record`.`value`, '$.coveredPayments'), 1),
		json_extract(`payment_record`.`value`, '$.receipt.fileId'),
		json_extract(`payment_record`.`value`, '$.receipt.fileName'),
		json_extract(`payment_record`.`value`, '$.receipt.fileViewUrl'),
		json_extract(`payment_record`.`value`, '$.receipt.monthlyFolderId'),
		json_extract(`payment_record`.`value`, '$.receipt.monthlyFolderViewUrl'),
		json_extract(`payment_record`.`value`, '$.receipt.registeredAt')
	FROM `normalized_items`, json_each(`normalized_items`.`item_json`, '$.paymentRecords') AS `payment_record`
	WHERE json_type(`payment_record`.`value`, '$.receipt') = 'object'
)
INSERT INTO `expense_receipts` (
	`all_receipts_folder_id`,
	`all_receipts_folder_view_url`,
	`covered_payments`,
	`expense_id`,
	`file_id`,
	`file_name`,
	`file_view_url`,
	`month`,
	`monthly_folder_id`,
	`monthly_folder_view_url`,
	`registered_at_iso`,
	`user_subject`
)
SELECT
	`all_receipts_folder_id`,
	`all_receipts_folder_view_url`,
	`covered_payments`,
	`expense_id`,
	`file_id`,
	`file_name`,
	`file_view_url`,
	`month`,
	`monthly_folder_id`,
	`monthly_folder_view_url`,
	`registered_at_iso`,
	`user_subject`
FROM `receipt_rows`
WHERE `file_id` IS NOT NULL
ON CONFLICT(`user_subject`, `expense_id`, `month`, `file_id`) DO UPDATE SET
	`all_receipts_folder_id` = excluded.`all_receipts_folder_id`,
	`all_receipts_folder_view_url` = excluded.`all_receipts_folder_view_url`,
	`covered_payments` = excluded.`covered_payments`,
	`file_name` = excluded.`file_name`,
	`file_view_url` = excluded.`file_view_url`,
	`monthly_folder_id` = excluded.`monthly_folder_id`,
	`monthly_folder_view_url` = excluded.`monthly_folder_view_url`,
	`registered_at_iso` = excluded.`registered_at_iso`;
--> statement-breakpoint
WITH `legacy_items` AS (
	SELECT
		`monthly_expenses_documents`.`user_subject`,
		`monthly_expenses_documents`.`month`,
		CAST(`item`.`key` AS integer) AS `item_index`,
		`item`.`value` AS `item_json`,
		json_extract(`item`.`value`, '$.id') AS `original_expense_id`,
		COUNT(*) OVER (
			PARTITION BY
				`monthly_expenses_documents`.`user_subject`,
				`monthly_expenses_documents`.`month`,
				json_extract(`item`.`value`, '$.id')
		) AS `same_expense_id_count`
	FROM `monthly_expenses_documents`, json_each(`monthly_expenses_documents`.`payload_json`, '$.items') AS `item`
),
`normalized_items` AS (
	SELECT
		`user_subject`,
		`month`,
		`item_json`,
		CASE
			WHEN `same_expense_id_count` > 1 THEN 'legacy:' || `user_subject` || ':' || `month` || ':' || `original_expense_id` || ':' || `item_index`
			ELSE `original_expense_id`
		END AS `expense_id`,
		CASE
			WHEN COALESCE(json_array_length(`item_json`, '$.paymentRecords'), 0) > 0 THEN (
				SELECT COALESCE(SUM(
					CASE
						WHEN json_type(`payment_record`.`value`, '$.receipt') IS NULL
							OR json_type(`payment_record`.`value`, '$.receipt') = 'null'
							THEN json_extract(`payment_record`.`value`, '$.coveredPayments')
						ELSE 0
					END
				), 0)
				FROM json_each(`item_json`, '$.paymentRecords') AS `payment_record`
			)
			ELSE COALESCE(
				json_extract(`item_json`, '$.manualCoveredPayments'),
				CASE
					WHEN json_extract(`item_json`, '$.isPaid') = 1
						AND COALESCE(json_array_length(`item_json`, '$.receipts'), 0) = 0
						AND json_type(`item_json`, '$.receipt') IS NULL
						THEN json_extract(`item_json`, '$.occurrencesPerMonth')
					ELSE 0
				END
			)
		END AS `manual_covered_payments`,
		COALESCE(json_array_length(`item_json`, '$.paymentRecords'), 0) AS `payment_records_count`
	FROM `legacy_items`
),
`payment_record_rows` AS (
	SELECT
		`normalized_items`.`user_subject`,
		`normalized_items`.`month`,
		`normalized_items`.`expense_id`,
		json_extract(`payment_record`.`value`, '$.coveredPayments') AS `covered_payments`,
		json_extract(`payment_record`.`value`, '$.id') AS `payment_record_id`,
		json_extract(`payment_record`.`value`, '$.receipt.fileId') AS `receipt_file_id`,
		json_extract(`payment_record`.`value`, '$.registeredAt') AS `registered_at_iso`
	FROM `normalized_items`, json_each(`normalized_items`.`item_json`, '$.paymentRecords') AS `payment_record`
	UNION ALL
	SELECT
		`normalized_items`.`user_subject`,
		`normalized_items`.`month`,
		`normalized_items`.`expense_id`,
		COALESCE(json_extract(`receipt`.`value`, '$.coveredPayments'), 1),
		'legacy-receipt-' || json_extract(`receipt`.`value`, '$.fileId'),
		json_extract(`receipt`.`value`, '$.fileId'),
		json_extract(`receipt`.`value`, '$.registeredAt')
	FROM `normalized_items`, json_each(`normalized_items`.`item_json`, '$.receipts') AS `receipt`
	WHERE `normalized_items`.`payment_records_count` = 0
	UNION ALL
	SELECT
		`user_subject`,
		`month`,
		`expense_id`,
		1,
		'legacy-receipt-' || json_extract(`item_json`, '$.receipt.fileId'),
		json_extract(`item_json`, '$.receipt.fileId'),
		NULL
	FROM `normalized_items`
	WHERE `payment_records_count` = 0
		AND json_type(`item_json`, '$.receipt') = 'object'
	UNION ALL
	SELECT
		`user_subject`,
		`month`,
		`expense_id`,
		`manual_covered_payments`,
		'legacy-manual-' || `expense_id`,
		NULL,
		NULL
	FROM `normalized_items`
	WHERE `payment_records_count` = 0
		AND `manual_covered_payments` > 0
)
INSERT INTO `expense_payment_records` (
	`covered_payments`,
	`expense_id`,
	`month`,
	`payment_record_id`,
	`receipt_file_id`,
	`registered_at_iso`,
	`user_subject`
)
SELECT
	`covered_payments`,
	`expense_id`,
	`month`,
	`payment_record_id`,
	`receipt_file_id`,
	`registered_at_iso`,
	`user_subject`
FROM `payment_record_rows`
WHERE `payment_record_id` IS NOT NULL
ON CONFLICT(`user_subject`, `expense_id`, `month`, `payment_record_id`) DO UPDATE SET
	`covered_payments` = excluded.`covered_payments`,
	`receipt_file_id` = excluded.`receipt_file_id`,
	`registered_at_iso` = excluded.`registered_at_iso`;
--> statement-breakpoint
DELETE FROM `expenses`
WHERE NOT EXISTS (
	SELECT 1
	FROM `expense_months`
	WHERE `expense_months`.`user_subject` = `expenses`.`user_subject`
		AND `expense_months`.`expense_id` = `expenses`.`expense_id`
);
--> statement-breakpoint
DROP TABLE `monthly_expenses_documents`;
