package com.tex.texapi.pojo.vo;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportParamsVO {
    //Query参数
    List<ExportParamVO> query;
    //Headers参数
    List<ExportParamVO>headers;
    //body参数
    List<ExportParamVO>body;
}
