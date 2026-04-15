package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Response;
import com.tex.texapi.pojo.vo.ResponseListVO;
import com.tex.texapi.pojo.vo.ResponseVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ResponseMapper {

    /**
     * 根据id获取响应参数
     * @param id
     * @return
     */
    @Select("select * from response where id=#{id}")
    ResponseVO getResponseById(Long id);

    void add(Response response);

    /**
     * 根据接口id获取响应参数列表
     *
     * @param apiId
     * @return
     */
    @Select("select id,name,response_code,content_type from response where api_id=#{apiId}")
    List<ResponseListVO> getListByApiId(Long apiId);


    void update(Response response);
}
