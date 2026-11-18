ALTER TABLE professional_accounts
    ADD COLUMN verification_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED';

UPDATE professional_accounts
SET verification_status = 'PENDING'
WHERE role = 'ADVOCATE';
