package com.un.explorer.dto;

import lombok.*;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlocDto {
    private String region;
    private int countryCount;
    private List<String> countries;
    private Map<String, Long> voteDistribution;
}