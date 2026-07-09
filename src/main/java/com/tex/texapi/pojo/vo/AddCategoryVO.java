package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AddCategoryVO {
    //主键
    Long id;

    //项目id
    Long projectId;

    //分类名
    String name;

    //父分类id
    Long parentId;
}
