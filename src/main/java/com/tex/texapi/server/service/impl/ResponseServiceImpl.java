package com.tex.texapi.server.service.impl;




import com.tex.texapi.pojo.dto.AddResponseDTO;
import com.tex.texapi.pojo.entity.Response;
import com.tex.texapi.pojo.vo.AddResponseVO;
import com.tex.texapi.pojo.vo.ResponseListVO;
import com.tex.texapi.pojo.vo.ResponseVO;
import com.tex.texapi.server.mapper.ResponseMapper;
import com.tex.texapi.server.service.ResponseService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResponseServiceImpl implements ResponseService {
    @Autowired
    private ResponseMapper responseMapper;

        /**
        * 获取响应参数
        * @param id
        */
    @Override
    public ResponseVO getResponse(Long id) {
        ResponseVO responseVO = responseMapper.getResponseById(id);
        return responseVO;
    }

    /**
     * 新增响应参数
     * @param addResponseDTO
     */
    @Override
    public AddResponseVO add(AddResponseDTO addResponseDTO) {
        Response response=new Response();
        BeanUtils.copyProperties(addResponseDTO,response);

        responseMapper.add(response);

        AddResponseVO addResponseVO=new AddResponseVO();
        BeanUtils.copyProperties(response,addResponseVO);

        return addResponseVO;
    }

    /**
     * 获取响应参数列表
     * @param apiId
     * @return
     */
    @Override
    public List list(Long apiId) {

        List<ResponseListVO> list= responseMapper.getListByApiId(apiId);
        return list;

    }

    /**
     * 更新响应参数
     * @param response
     */
    public void update(Response response) {
        responseMapper.update(response);
    }
}
