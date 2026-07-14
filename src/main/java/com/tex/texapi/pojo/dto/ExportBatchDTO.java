package com.tex.texapi.pojo.dto;

import lombok.Data;

@Data
public class ExportBatchDTO {
    //接口id
    Long apiId;

    //body参数的format-type
    String formatType;
}
