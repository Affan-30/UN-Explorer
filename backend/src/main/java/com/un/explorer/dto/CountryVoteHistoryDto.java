package com.un.explorer.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CountryVoteHistoryDto {
    private Long resolutionId;
    private String resolutionNumber;
    private String title;
    private Integer sessionYear;
    private LocalDate voteDate;
    private String voteType;
    private List<String> topics;
}