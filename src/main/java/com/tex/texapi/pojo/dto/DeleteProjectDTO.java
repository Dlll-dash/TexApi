package com.tex.texapi.pojo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeleteProjectDTO {
    //项目ID
    Long projectId;

    //团队ID
    Long teamId;
}
