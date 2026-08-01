package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMemberVO implements Serializable {
    //主键
    Long id;

    //用户ID
    Long userId;

    //用户名
    String userName;

    //角色
    int role;

    //加入时间
    LocalDateTime joinTime;
}
