package com.un.explorer.repository;

import com.un.explorer.model.Resolution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResolutionRepository extends JpaRepository<Resolution, Long> {

    // Search by title or resolution number, optionally filtered by topic slug and year
    @Query("""
        SELECT DISTINCT r FROM Resolution r
        LEFT JOIN r.topics t
        WHERE (:search IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%'))
                               OR LOWER(r.resolutionNumber) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:topicSlug IS NULL OR t.slug = :topicSlug)
          AND (:year IS NULL OR r.sessionYear = :year)
        ORDER BY r.voteDate DESC
        """)
    Page<Resolution> search(
            @Param("search")    String search,
            @Param("topicSlug") String topicSlug,
            @Param("year")      Integer year,
            Pageable pageable
    );

//    Resolution findById(Long id);
Optional<Resolution> findByResolutionNumber(String resolutionNumber);
}
