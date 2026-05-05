package com.un.explorer.repository;

import com.un.explorer.model.SimilarityCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SimilarityCacheRepository extends JpaRepository<SimilarityCache, Long> {

    @Query("""
        SELECT sc FROM SimilarityCache sc
        JOIN FETCH sc.countryA
        JOIN FETCH sc.countryB
        WHERE (sc.countryA.id = :countryId OR sc.countryB.id = :countryId)
        ORDER BY sc.similarityScore DESC
        """)
    List<SimilarityCache> findAllForCountry(@Param("countryId") Long countryId);

    Optional<SimilarityCache> findByCountryAIdAndCountryBId(Long aId, Long bId);
}