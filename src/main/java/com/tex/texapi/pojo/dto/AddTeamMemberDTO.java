package com.tex.texapi.pojo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddTeamMemberDTO {
    //团队id
    Long teamId;

    //用户id（旧版兼容，逐步废弃）
    Long userId;

    //用户uuid（新版推荐）
    String userUuid;

    //用户名
    String userName;

    //权限
    int role;
}
