package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class ExportBatchDTO {
    //接口id
    Long apiId;

    //body参数的format-type
    String formatType;

    //是否导出草稿（true=草稿，false=主表）
    Boolean useDraft;
}
