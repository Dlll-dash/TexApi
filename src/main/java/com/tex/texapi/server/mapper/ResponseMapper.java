package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Response;
import com.tex.texapi.pojo.vo.ResponseListVO;
import com.tex.texapi.pojo.vo.ResponseVO;
import org.apache.ibatis.annotations.Delete;
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
    Response getResponseById(Long id);

    void add(Response response);

    /**
     * 根据接口id获取响应参数列表
     *
     * @param apiId
     * @return
     */
    @Select("select id,name,response_code,content_type from response where api_id=#{apiId}")
    List<ResponseListVO> getListByApiId(Long apiId);

    /**
     * 更新响应参数Body
     * @param response
     */
    void update(Response response);

    /**
     * 更新响应参数信息
     * @param response
     */
    void updateInfo(Response response);

    @Delete("delete from response where api_id=#{apiId}")
    void deleteByApiId(Long apiId);

    @Select("select * from response where api_id=#{apiId}")
    ResponseVO getByApiId(Long apiId);
}
