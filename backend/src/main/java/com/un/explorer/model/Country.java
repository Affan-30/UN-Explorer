package com.un.explorer.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "countries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "iso2_code", nullable = false, length = 2, unique = true)
    private String iso2Code;

    @Column(name = "iso3_code", nullable = false, length = 3, unique = true)
    private String iso3Code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Region region;

    @Column(name = "un_member_since")
    private Integer unMemberSince;

    public enum Region {
        Africa,
        Americas,
        Asia_Pacific,   // stored as "Asia-Pacific" via @Column name
        Europe,
        Middle_East     // stored as "Middle East"
    }
}