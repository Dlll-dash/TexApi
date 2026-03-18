package com.tex.texapi.server.service.impl;

import com.tex.texapi.pojo.dto.ParamDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.server.mapper.ApiMapper;
import com.tex.texapi.server.service.ApiService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApiServiceImpl implements ApiService {
    @Autowired
    private ApiMapper apiMapper;

    /**
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    @Override
    public List<Api> list(Long id) {
        List<Api> list=apiMapper.list(id);
        return list;
    }

    /**
     * 添加Query参数
     * @param paramDTO
     * @return
     */
    @Override
    public Params addParam(ParamDTO paramDTO) {
        Params param=new Params();
        BeanUtils.copyProperties(paramDTO,param);
        apiMapper.addParam(param);
        return param;
    }
    /**
     * 获取Query参数列表
     * @param id
     * @return
     */
    @Override
    public List<Params> getParams(Long id) {
        List<Params>list=apiMapper.getParams(id);
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
        apiMapper.updateParam(param);
    }

    /**
     * 删除Query参数
     * @param id
     */
    @Override
    public void deleteParam(Long id) {
        apiMapper.deleteById(id);
    }
}
