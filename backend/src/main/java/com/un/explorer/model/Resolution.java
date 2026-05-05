package com.un.explorer.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name = "resolutions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resolution_number", nullable = false, length = 30, unique = true)
    private String resolutionNumber;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "session_year", nullable = false)
    private Integer sessionYear;

    @Column(name = "vote_date")
    private LocalDate voteDate;

    @Column(name = "total_yes")
    private Integer totalYes = 0;

    @Column(name = "total_no")
    private Integer totalNo = 0;

    @Column(name = "total_abstain")
    private Integer totalAbstain = 0;

    @Column(name = "total_absent")
    private Integer totalAbsent = 0;

    // Many-to-many with topics
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "resolution_topics",
            joinColumns = @JoinColumn(name = "resolution_id"),
            inverseJoinColumns = @JoinColumn(name = "topic_id")
    )
    @Builder.Default
    private Set<Topic> topics = new HashSet<>();

    // One resolution → many votes
    @OneToMany(mappedBy = "resolution", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Vote> votes = new ArrayList<>();

}