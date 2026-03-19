package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.BodyParamDTO;
import com.tex.texapi.pojo.dto.ParamDTO;
import com.tex.texapi.pojo.entity.BodyParam;
import com.tex.texapi.pojo.entity.Params;

import java.util.List;

public interface RequestParamsService {
    /**
     * 新增Query请求参数
     *
     * @param paramDTO
     * @return Param
     */
    Params addParam(ParamDTO paramDTO);

    /**
     * 获取Query参数列表
     * @param id
     * @return
     */
    List<Params> getParams(Long id);

    /**
     * 更新Query参数信息
     * @param paramDTO
     * @param id
     * @return
     */
    void upadateParam(ParamDTO paramDTO,Long id);

    /**
     * 删除Query参数
     * @param id
     */
    void deleteParam(Long id);




    /**
     * 新增FormData请求参数
     *
     * @param paramDTO
     * @return Param
     */
    BodyParam addFormData(BodyParamDTO paramDTO);

    /**
     * 获取FormData参数列表
     *
     * @param id
     * @return
     */
    List<BodyParam> getFormData(Long id);

    /**
     * 更新FormData参数信息
     * @param paramDTO
     * @param id
     * @return
     */
    void upadateFormData(BodyParamDTO paramDTO, Long id);

    /**
     * 删除FormData参数
     * @param id
     */
    void deleteFormData(Long id);
}
