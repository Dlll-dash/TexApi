package com.tex.texapi.pojo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTeamMemberDTO {
    //团队ID
    Long teamId;

    //用户ID（旧版兼容）
    Long userId;

    //用户UUID（新版推荐）
    String userUuid;

    //新角色
    int role;
}
