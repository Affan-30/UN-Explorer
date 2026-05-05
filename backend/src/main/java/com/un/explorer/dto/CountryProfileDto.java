package com.un.explorer.dto;

import lombok.*;
import java.util.*;

@Data
@Builder
public class CountryProfileDto {
    private CountryDto country;
    private Map<String, Long> stats;
    private List<YearTrendDto> trend;

    @Data
    @Builder
    @AllArgsConstructor
    public static class YearTrendDto {
        private Integer year;
        private Integer yesPct;
        private Long total;
    }
}