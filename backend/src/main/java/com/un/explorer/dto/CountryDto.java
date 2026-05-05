package com.un.explorer.dto;

import com.un.explorer.model.Country;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CountryDto {
    private Long id;
    private String name;
    private String iso2Code;
    private String iso3Code;
    private String region;
    private Integer unMemberSince;

    public static CountryDto from(Country c) {
        return CountryDto.builder()
                .id(c.getId())
                .name(c.getName())
                .iso2Code(c.getIso2Code())
                .iso3Code(c.getIso3Code())
                .region(c.getRegion() != null
                        ? c.getRegion().name().replace("_", " ")
                        : null)
                .unMemberSince(c.getUnMemberSince())
                .build();
    }
}