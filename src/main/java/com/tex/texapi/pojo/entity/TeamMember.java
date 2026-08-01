package com.tex.texapi.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {
    //主键
    Long id;

    //团队ID
    Long teamId;

    //用户ID
    Long userId;

    //用户名
    String userName;

    //角色
    int role;

    //加入时间
    LocalDateTime joinTime;

    //权限等级
    public static final int VIEWER=1;
    public static final int EDITOR=2;
    public static final int ADMIN=3;
    public static final int OWNER=4;


}
