-- =============================================================================
-- 0004_thermapen_typo.sql : fix "Therapen" -> "Thermapen" in the gear search URL
--
-- Row thermapen-one's affiliate_url searched Amazon for "ThermoWorks Therapen ONE"
-- (audit-admin.md C11). Only the URL had the typo; the name was already right.
-- Idempotent: only touches rows that still contain the typo.
-- =============================================================================

update public.gear
set affiliate_url = replace(affiliate_url, 'Therapen', 'Thermapen')
where affiliate_url like '%Therapen%';
