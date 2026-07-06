-- Additive surcharge model: the IIBB toggle used to include the 21% VAT (it
-- multiplied by solidario/oficial = 1 + IIBB + VAT). Now IIBB and VAT are
-- independent and stack additively over the base. Rows that had IIBB enabled
-- must also enable VAT so their converted total stays exactly the same
-- (base × (1 + IIBB + VAT)). Rows that had both enabled were double-counting VAT
-- and are intentionally corrected by the new calculation.
UPDATE `expenses` SET `usd_rate_applies_iva` = 1 WHERE `usd_rate_applies_iibb` = 1;
