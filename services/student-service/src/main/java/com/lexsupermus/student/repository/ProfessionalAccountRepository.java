package com.lexsupermus.student.repository;

import com.lexsupermus.student.model.ProfessionalAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfessionalAccountRepository
        extends JpaRepository<ProfessionalAccount, UUID> {

    Optional<ProfessionalAccount> findByEmail(String email);

    boolean existsByEmail(String email);
}
