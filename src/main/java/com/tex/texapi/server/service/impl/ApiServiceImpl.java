package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.exception.RequestException;
import com.tex.texapi.common.utils.HttpClientUtil;
import com.tex.texapi.pojo.dto.AddApiDTO;
import com.tex.texapi.pojo.dto.RequestDTO;
import com.tex.texapi.pojo.dto.UpdateApiInfoDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.pojo.entity.Request;
import com.tex.texapi.pojo.vo.AddApiVO;
import com.tex.texapi.server.mapper.ApiMapper;
import com.tex.texapi.server.mapper.RequestParamsMapper;
import com.tex.texapi.server.mapper.ResponseMapper;
import com.tex.texapi.server.service.ApiService;
import okhttp3.*;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ApiServiceImpl implements ApiService {
    @Autowired
    private ApiMapper apiMapper;
    @Autowired
    private RequestParamsMapper requestParamsMapper;
    @Autowired
    private ResponseMapper responseMapper;

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
     * 添加接口
     *
     * @param addApiDTO
     * @return
     */
    @Override
    public AddApiVO addApi(AddApiDTO addApiDTO) {
        addApiDTO.setCreateUser(BaseContext.getCurrentId());
        apiMapper.addApi(addApiDTO);
        AddApiVO addApiVO=new AddApiVO();
        BeanUtils.copyProperties(addApiDTO,addApiVO);
        return addApiVO;
    }

    @Override
    public void updateApi(Api api) {
        apiMapper.updateApi(api);
    }

    @Override
    public String send(RequestDTO requestDTO) {
        //获取api实体
        Api api=apiMapper.getById(requestDTO.getApiId());

        //获取url
        String baseUrl=api.getRequestUrl();

        if(baseUrl==null||baseUrl.isEmpty()){
            //url为空则抛出异常
            throw new RequestException(MessageConstant.URL_EMPTY);
        }

        //判断状态是否为启用
        if(api.getStatus()==Api.MAINTAINING){
            //禁用则抛出异常
            throw new RequestException(MessageConstant.API_FORBIDDEN);
        }

        //获取Query参数
        List<Params> params=requestParamsMapper.getParams(requestDTO.getApiId(), Request.Query);

        //拼接Query参数到url上
        HttpUrl.Builder urlBuilder=HttpUrl.parse(baseUrl).newBuilder();

        //遍历每个Query参数，加入到url上
        params.forEach(p ->{
            urlBuilder.addQueryParameter(p.getName(),p.getValue());
        } );

        String url=urlBuilder.toString();

        //获取Body参数
        String contentType=requestDTO.getContentType();
        List<Params> bodyParams=requestParamsMapper.getParams(requestDTO.getApiId(), contentType);
        RequestBody requestBody=null;

        //构建RequestBody
        if(contentType.equals(Request.FormData)){
            try {
                //form-data构建（不含文件上传）
                MultipartBody.Builder builder = new MultipartBody.Builder();


                if(bodyParams!=null&&!bodyParams.isEmpty()) {
                    bodyParams.forEach(p -> {
                        builder.addFormDataPart(p.getName(), p.getValue());
                    });
                }
                requestBody = builder.build();
            }catch (Exception e){
                throw new RequestException(MessageConstant.REQUEST_FAILED);
            }
        }else if(contentType.equals(Request.Json)){

            //json构建
            String jsonStr=bodyParams.get(0).getValue();
            requestBody=RequestBody.create(jsonStr,MediaType.parse("application/json"));

        }else if(contentType.equals(Request.Urlencoded)){

            //x-www-urlencode构建
            FormBody.Builder builder=new FormBody.Builder();
            bodyParams.forEach(p->{
                builder.add(p.getName(),p.getValue());
            });
            requestBody=builder.build();
        }

        //获取Headers参数
        List<Params> headerParams=requestParamsMapper.getParams(requestDTO.getApiId(),Request.Header);

        //构建Headers
        Map<String,String>mp=headerParams.stream()
                .collect(Collectors.toMap(
                        Params::getName,
                        Params::getValue
                ));
        Headers headers=Headers.of(mp);

        //发送请求
        String method=api.getRequestMethod();
        Response response=null;
        try {
            if (method.equals(Request.GET)) {
                //GET请求
                response = HttpClientUtil.doGET(url, headers);

            } else if (method.equals(Request.POST)) {
                //POST请求
                response = HttpClientUtil.doPOST(url,requestBody,headers);

            } else if (method.equals(Request.PUT)) {
                //PUT请求
                response = HttpClientUtil.doPUT(url,requestBody,headers);

            } else if (method.equals(Request.DELETE)) {
                //DELETE请求
                response = HttpClientUtil.doDELETE(url,headers);

            }
        }catch (IOException e){
            throw new RequestException(MessageConstant.REQUEST_FAILED);
        }

        //返回结果
        return response.body().toString();
    }

    //更新接口信息
    @Override
    public void updateInfo(UpdateApiInfoDTO updateApiInfoDTO) {
        apiMapper.updateInfo(updateApiInfoDTO);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        //删除接口
        apiMapper.deleteById(id);
        //删除接口相关的参数
        requestParamsMapper.deleteByApiId(id);
        //删除接口相关的响应参数
        responseMapper.deleteByApiId(id);
    }
}
