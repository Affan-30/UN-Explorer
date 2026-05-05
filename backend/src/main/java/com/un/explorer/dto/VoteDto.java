package com.un.explorer.dto;

import com.un.explorer.model.Vote;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoteDto {
    private Long countryId;
    private String countryName;
    private String iso2Code;
    private String region;
    private String voteType;

    public static VoteDto from(Vote v) {
        return VoteDto.builder()
                .countryId(v.getCountry().getId())
                .countryName(v.getCountry().getName())
                .iso2Code(v.getCountry().getIso2Code())
                .region(v.getCountry().getRegion() != null
                        ? v.getCountry().getRegion().name().replace("_", " ")
                        : null)
                .voteType(v.getVoteType().name())
                .build();
    }
}