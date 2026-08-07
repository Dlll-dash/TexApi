package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 用户搜索结果的轻量VO —— 仅暴露对外标识和公开信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearchResultVO implements Serializable {

    //对外唯一标识
    String uuid;

    //用户名
    String userName;

    //姓名
    String name;

    //邮箱
    String email;
}
