package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.ParamDTO;
import com.tex.texapi.pojo.dto.UpdateParamDTO;
import com.tex.texapi.pojo.entity.Params;

import java.util.List;

public interface RequestParamsService {
    /**
     * 新增请求参数
     *
     * @param paramDTO
     * @return Param
     */
    Params addParam(ParamDTO paramDTO);

    /**
     * 获取参数列表
     * @param id
     * @param formatType
     * @return
     */
    List<Params> getParams(Long id,String formatType);

    /**
     * 更新参数信息
     * @param updateParamDTO
     * @param id
     * @return
     */
    void upadateParam(UpdateParamDTO updateParamDTO, Long id);

    /**
     * 删除参数
     * @param id
     */
    void deleteParam(Long id);

}
