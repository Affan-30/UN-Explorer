package com.un.explorer.repository;
import com.un.explorer.model.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CountryRepository extends JpaRepository<Country, Long> {
    List<Country> findAllByOrderByNameAsc();
    Optional<Country> findByIso2Code(String iso2Code);
}


// ── Topic ─────────────────────────────────────────────────────────────────────




// ── Vote ──────────────────────────────────────────────────────────────────────


// ── SimilarityCache ───────────────────────────────────────────────────────────
