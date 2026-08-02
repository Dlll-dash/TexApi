package com.tex.texapi.pojo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTeamDTO {
    //团队ID
    Long id;

    //团队名
    String name;

    //描述
    String description;

    /**
     * 团队ID（与id相同，供TeamAuthAspect反射调用）
     */
    public Long getTeamId() {
        return id;
    }
}
