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
}
