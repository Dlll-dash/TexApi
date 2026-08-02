package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.exception.InputException;
import com.tex.texapi.pojo.dto.ParamDTO;
import com.tex.texapi.pojo.dto.UpdateParamDTO;
import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.common.enumeration.CheckType;
import com.tex.texapi.server.annotation.TeamAuth;
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
     * 添加参数
     * @param paramDTO
     * @return
     */
    @Override
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.API)
    public Params addParam(ParamDTO paramDTO) {
        Params param=new Params();
        BeanUtils.copyProperties(paramDTO,param);
        if(param.getName()==null||param.getName().isEmpty()){
            throw new InputException(MessageConstant.PARAM_NAME_EMPTY);
        }
        if(param.getIsNecessary()==null){
            param.setIsNecessary(false);
        }
        if(param.getIsChecked()==null){
            param.setIsChecked(true);
        }
        requestParamsMapper.addParam(param);
        return param;
    }
    /**
     * 获取参数列表
     * @param apiId 接口id
     * @param formatType
     * @return
     */
    @Override
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.API)
    public List<Params> getParams(Long apiId,String formatType) {
        List<Params>list=requestParamsMapper.getParams(apiId,formatType);
        return list;
    }
    /**
     * 修改参数
     * @param updateParamDTO
     * @param id 参数id
     */
    @Override
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.PARAM)
    public void upadateParam(UpdateParamDTO updateParamDTO, Long id) {
        Params param=new Params();
        BeanUtils.copyProperties(updateParamDTO,param);
        param.setId(id);
        requestParamsMapper.updateParam(param);
    }

    /**
     * 删除参数
     * @param id
     */
    @Override
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.PARAM)
    public void deleteParam(Long id) {
        requestParamsMapper.deleteParamById(id);
    }
}
