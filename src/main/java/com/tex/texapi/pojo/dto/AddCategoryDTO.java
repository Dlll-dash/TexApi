package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class AddCategoryDTO {
    //项目ID
    Long projectId;

    //项目名
    String name;

    //父分类id
    Long parentId;

    //是否是草稿
    Boolean isDraft;

    //草稿对应的主表id
    Long baseId;
}
