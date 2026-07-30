package com.tex.texapi.pojo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Params {
    //主键
    Long id;
    //参数名
    String name;
    //参数值
    String value;
    //参数类型
    String type;
    //参数格式
    String formatType;
    //说明
    String explanation;
    //所属接口id
    Long apiId;
    //是否必须
    Boolean isNecessary;
    //是否选中
    Boolean isChecked;
    //是否是草稿
    Boolean isDraft;
    //草稿的主表id
    Long baseId;
}
