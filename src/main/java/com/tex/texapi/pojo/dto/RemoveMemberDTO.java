package com.tex.texapi.pojo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemoveMemberDTO {
    //团队ID
    Long teamId;

    //用户ID
    Long userId;
}
