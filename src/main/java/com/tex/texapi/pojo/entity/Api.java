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
public class Api {
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

    //创建者名称（由 mapper JOIN 填充）
    String createUserName;

    //接口更新时间
    LocalDateTime updateTime;

    //更新者ID
    Long updateUser;

    //更新者名称（由 mapper JOIN 填充）
    String updateUserName;

    //状态 0 开发中 1 维护中 2 已发行
    Integer status;

    //接口说明
    String explanation;

    //责任人
    String inChargeUser;

    //分类
    Long categoryId;

    //草稿的主表id
    Long baseId;

    //是否是草稿
    Boolean isDraft;

    //草稿删除标记（1=已删除，发布时删除主表；listDrafts 时跳过）
    Boolean markDeleted;

    //Body 参数格式（null/none, json, formData, urlencoded）
    String bodyType;

    //接口状态
    public static final int DEVELOPING = 1;
    public static final int MAINTAINING = 0;
    public static final int RELEASED = 2;
}
