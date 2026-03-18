package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.Params;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ApiMapper {

    /**
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    @Select("select * from api where project_id=#{id} order by status desc")
    List<Api> list(Long id);

    /**
     * 新增Query请求参数
     * @param param
     * @return
     */
    //@Insert("insert into request_params (name, value, type, explanation, api_id) VALUES (#{name},#{value},#{type},#{explanation},#{apiId})")
    void addParam(Params param);

    /**
     * 根据接口id获取请求参数列表
     * @param id
     * @return
     */
    @Select("select * from request_params where api_id=#{id}")
    List<Params> getParams(Long id);

    /**
     * 修改请求参数
     * @param param
     */
    void updateParam(Params param);

    /**
     * 根据id删除请求参数
     * @param id
     */
    @Delete("delete from request_params where id = #{id}")
    void deleteById(Long id);
}
