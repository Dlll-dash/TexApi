package com.tex.texapi.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    //主键
    Long id;

    //项目id
    Long projectId;

    //分类名
    String name;

    //父分类id
    Long parentId;

    //创建者id
    Long createUser;

    //乐观锁版本号
    Long version;

    //草稿的主表id
    Long baseId;

    //是否是草稿
    Boolean isDraft;

    //草稿删除标记（1=标记删除，发布时删除主表）
    Boolean markDeleted;
}
