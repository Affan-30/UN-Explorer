package com.un.explorer.dto;

import com.un.explorer.dto.CountryDto;
import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarityDto {
    private CountryDto countryA;
    private CountryDto countryB;
    private BigDecimal score;
    private Long matchingVotes;
    private Long totalCompared;
    private String interpretation;
}