package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryVO {
    //主键
    Long id;

    //项目id
    Long projectId;

    //分类名
    String name;

    //父分类id
    Long parentId;

    //子分类列表
    List<CategoryVO> children;

    //草稿标记
    Boolean isDraft;

    //草稿对应的主表ID
    Long baseId;

    //创建者ID
    Long createUser;
}
