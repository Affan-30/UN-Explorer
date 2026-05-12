package com.un.explorer.repository;

import com.un.explorer.model.Country;
import com.un.explorer.model.Resolution;
import com.un.explorer.model.Vote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    // All votes on one resolution, with country info eagerly loaded
    @Query("SELECT v FROM Vote v JOIN FETCH v.country WHERE v.resolution.id = :resId ORDER BY v.voteType, v.country.name")
    List<Vote> findByResolutionId(@Param("resId") Long resId);

    // Full voting history for one country
//    @Query("""
//SELECT DISTINCT v FROM Vote v
//JOIN FETCH v.resolution r
//LEFT JOIN FETCH r.topics t
//WHERE v.country.id = :countryId
//AND (:year IS NULL OR r.sessionYear = :year)
//AND (:topicSlug IS NULL OR t.slug = :topicSlug)
//""")
//    Page<Vote> findByCountryId(
//            Long countryId,
//            String topicSlug,
//            Integer year,
//            Pageable pageable
//    );
    @Query(
            value = """
        SELECT v FROM Vote v
        JOIN v.resolution r
        WHERE v.country.id = :countryId
        AND (:year IS NULL OR r.sessionYear = :year)
        AND (:topicSlug IS NULL OR EXISTS (
            SELECT 1 FROM r.topics t WHERE t.slug = :topicSlug
        ))
        """,
            countQuery = """
        SELECT COUNT(v) FROM Vote v
        JOIN v.resolution r
        WHERE v.country.id = :countryId
        AND (:year IS NULL OR r.sessionYear = :year)
        AND (:topicSlug IS NULL OR EXISTS (
            SELECT 1 FROM r.topics t WHERE t.slug = :topicSlug
        ))
        """
    )
    Page<Vote> findByCountryId(Long countryId, String topicSlug, Integer year, Pageable pageable);

    // Similarity computation — find shared votes between two countries
    @Query("""
        SELECT
          SUM(CASE WHEN va.voteType = vb.voteType THEN 1 ELSE 0 END),
          COUNT(va)
        FROM Vote va
        JOIN Vote vb ON va.resolution.id = vb.resolution.id
        WHERE va.country.id = :aId
          AND vb.country.id = :bId
          AND va.voteType <> 'absent'
          AND vb.voteType <> 'absent'
        """)
    List<Object[]> computeSharedVotes(@Param("aId") Long aId, @Param("bId") Long bId);

    // Vote stats breakdown for a country
    @Query("SELECT v.voteType, COUNT(v) FROM Vote v WHERE v.country.id = :countryId GROUP BY v.voteType")
    List<Object[]> countByVoteTypeForCountry(@Param("countryId") Long countryId);

    // Year-wise yes% trend for a country
    @Query("""
        SELECT r.sessionYear,
               SUM(CASE WHEN v.voteType = 'yes' THEN 1 ELSE 0 END),
               COUNT(v)
        FROM Vote v
        JOIN v.resolution r
        WHERE v.country.id = :countryId
          AND v.voteType <> 'absent'
        GROUP BY r.sessionYear
        ORDER BY r.sessionYear DESC
        """)
    List<Object[]> yearlyTrendForCountry(@Param("countryId") Long countryId);

    @Query("""
SELECT v FROM Vote v
JOIN v.resolution r
LEFT JOIN r.topics t
WHERE (:topic IS NULL OR t.slug = :topic)
""")
    List<Vote> findAllVotes(@Param("topic") String topic);

    boolean existsByResolutionAndCountry(Resolution resolution, Country country);

    @Query("""
    SELECT CONCAT(v.resolution.id, ':', v.country.id)
    FROM Vote v
""")
    List<String> findAllVoteKeys();
}
