package com.un.explorer.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarityRankingDto {
    private Long id;
    private String name;
    private String iso2Code;
    private String region;
    private BigDecimal score;
    private Integer resolutionsCompared;
}