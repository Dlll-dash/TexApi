package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class UpdateCategoryDTO {

    //分类名
    String name;

    //父分类id
    Long parentId;
}
