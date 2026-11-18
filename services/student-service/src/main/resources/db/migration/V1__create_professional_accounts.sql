CREATE TABLE professional_accounts (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    city VARCHAR(150),
    role VARCHAR(20) NOT NULL,
    profile_data TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_professional_accounts_email UNIQUE (email)
);
