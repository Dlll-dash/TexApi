package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Params;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RequestParamsMapper {
    /**
     * 新增请求参数
     *
     * @param param
     * @return
     */
    void addParam(Params param);

    /**
     * 根据接口id获取请求参数列表
     *
     * @param id
     * @param formatType
     * @return
     */
    @Select("select * from request_params where api_id=#{id} and format_type=#{formatType}")
    List<Params> getParams(Long id, String formatType);

    /**
     * 修改请求参数
     *
     * @param param
     */
    void updateParam(Params param);

    /**
     * 根据id删除请求参数
     *
     * @param id
     */
    @Delete("delete from request_params where id = #{id}")
    void deleteParamById(Long id);

}