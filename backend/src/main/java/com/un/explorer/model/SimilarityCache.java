package com.un.explorer.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "similarity_cache",
        uniqueConstraints = @UniqueConstraint(columnNames = {"country_a_id", "country_b_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimilarityCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_a_id", nullable = false)
    private Country countryA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_b_id", nullable = false)
    private Country countryB;

    @Column(name = "similarity_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal similarityScore;

    @Column(name = "resolutions_compared", nullable = false)
    private Integer resolutionsCompared;

    @Column(name = "computed_at")
    private LocalDateTime computedAt;

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.computedAt = LocalDateTime.now();
    }
}