package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.FormatTypeConstant;
import com.tex.texapi.pojo.dto.BodyParamDTO;
import com.tex.texapi.pojo.dto.ParamDTO;
import com.tex.texapi.pojo.entity.BodyParam;
import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.server.mapper.RequestParamsMapper;
import com.tex.texapi.server.service.RequestParamsService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RequestParamsServiceImpl implements RequestParamsService {
    @Autowired
    private RequestParamsMapper requestParamsMapper;

    /**
     * 添加Query参数
     * @param paramDTO
     * @return
     */
    @Override
    public Params addParam(ParamDTO paramDTO) {
        Params param=new Params();
        BeanUtils.copyProperties(paramDTO,param);
        requestParamsMapper.addParam(param);
        return param;
    }
    /**
     * 获取Query参数列表
     * @param id
     * @return
     */
    @Override
    public List<Params> getParams(Long id) {
        List<Params>list=requestParamsMapper.getParams(id);
        return list;
    }
    /**
     * 修改Query参数
     * @param paramDTO
     */
    @Override
    public void upadateParam(ParamDTO paramDTO,Long id) {
        Params param=new Params();
        BeanUtils.copyProperties(paramDTO,param);
        param.setId(id);
        requestParamsMapper.updateParam(param);
    }

    /**
     * 删除Query参数
     * @param id
     */
    @Override
    public void deleteParam(Long id) {
        requestParamsMapper.deleteParamById(id);
    }



    /**
     * 添加FormData参数
     *
     * @param bodyParamDTO
     * @return
     */
    @Override
    public BodyParam addFormData(BodyParamDTO bodyParamDTO) {
        BodyParam bodyParam=new BodyParam();
        BeanUtils.copyProperties(bodyParamDTO,bodyParam);
        bodyParam.setFormatType(FormatTypeConstant.FORM_DATA);
        requestParamsMapper.addFormData(bodyParam);
        return bodyParam;
    }
    /**
     * 获取FormData参数列表
     *
     * @param id
     * @return
     */
    @Override
    public List<BodyParam> getFormData(Long id) {
        List<BodyParam>list=requestParamsMapper.getFormData(id);
        return list;
    }
    /**
     * 修改FormData参数
     * @param bodyParamDTO
     */
    @Override
    public void upadateFormData(BodyParamDTO bodyParamDTO, Long id) {
        BodyParam bodyParam=new BodyParam();
        BeanUtils.copyProperties(bodyParamDTO,bodyParam);
        bodyParam.setId(id);
        requestParamsMapper.updateFormData(bodyParam);
    }

    /**
     * 删除FormData参数
     * @param id
     */
    @Override
    public void deleteFormData(Long id) {
        requestParamsMapper.deleteFormDataById(id);
    }
}
