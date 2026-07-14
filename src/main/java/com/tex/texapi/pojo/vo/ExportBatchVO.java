package com.tex.texapi.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportBatchVO {
    //接口id
    Long apiId;
    //请求参数
    ExportParamsVO params;
    //响应参数
    ExportResponseVO response;
}
