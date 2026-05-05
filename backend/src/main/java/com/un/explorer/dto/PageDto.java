package com.un.explorer.dto;

import lombok.*;
import java.util.*;

@Data
@AllArgsConstructor
public class PageDto<T> {
    private List<T> data;
    private int page;
    private int limit;
    private long total;
}