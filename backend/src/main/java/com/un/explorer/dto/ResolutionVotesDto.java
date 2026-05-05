package com.un.explorer.dto;

import lombok.*;
import java.util.*;

@Data
@Builder
public class ResolutionVotesDto {
    private Long resolutionId;
    private Map<String, List<VoteDto>> votes;
    private int total;
}