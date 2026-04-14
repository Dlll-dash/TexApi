package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.AddResponseDTO;
import com.tex.texapi.pojo.vo.AddResponseVO;
import com.tex.texapi.pojo.vo.ResponseVO;

import java.util.List;

public interface ResponseService {

    /**
     * 根据id获取响应参数
     * @param id
     * @return
     */
    ResponseVO getResponse(Long id);

    /**
     * 新增响应参数
     * @param addResponseDTO
     * @return
     */
    AddResponseVO add(AddResponseDTO addResponseDTO);

    /**
     * 根据apiId获取响应参数列表
     *
     * @param apiId
     * @return
     */
    List list(Long apiId);
}
