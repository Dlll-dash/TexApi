package com.tex.texapi.pojo.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApiVO {
    //主键
    Long id;

    //项目id
    Long projectId;

    //接口名
    String apiName;

    //接口url
    String requestUrl;

    //接口调用方法
    String requestMethod;

    //创建时间
    LocalDateTime createTime;

    //创建者ID
    Long createUser;

    //创建者名称
    String createUserName;

    //接口更新时间
    LocalDateTime updateTime;

    //更新者ID
    Long updateUser;

    //更新者名称
    String updateUserName;

    //状态 0 开发中 1 维护中 2 已发行
    Integer status;

    //接口说明
    String explanation;

    //责任人
    String inChargeUser;

    //分类
    Long categoryId;

    //是否是草稿
    Boolean isDraft;

    //草稿对应的主表id
    Long baseId;

    //主表更新时间（用于冲突检测，仅草稿有值）
    LocalDateTime masterUpdateTime;
}
