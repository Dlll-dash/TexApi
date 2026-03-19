package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.BodyParam;
import com.tex.texapi.pojo.entity.Params;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface RequestParamsMapper {
    /**
     * 新增Query请求参数
     * @param param
     * @return
     */
    //@Insert("insert into request_params (name, value, type, explanation, api_id) VALUES (#{name},#{value},#{type},#{explanation},#{apiId})")
    void addParam(Params param);

    /**
     * 根据接口id获取Query请求参数列表
     * @param id
     * @return
     */
    @Select("select * from request_params where api_id=#{id}")
    List<Params> getParams(Long id);

    /**
     * 修改Query请求参数
     * @param param
     */
    void updateParam(Params param);

    /**
     * 根据id删除Query请求参数
     * @param id
     */
    @Delete("delete from request_params where id = #{id}")
    void deleteParamById(Long id);



    /**
     * 新增FormData请求参数
     * @param bodyParam
     * @return
     */
    void addFormData(BodyParam bodyParam);

    /**
     * 根据接口id获取FormData请求参数列表
     *
     * @param id
     * @return
     */
    @Select("select * from request_body where api_id=#{id}")
    List<BodyParam> getFormData(Long id);

    /**
     * 修改FormData请求参数
     * @param param
     */
    void updateFormData(BodyParam param);

    /**
     * 根据id删除FormData参数
     * @param id
     */
    @Delete("delete from request_params where id = #{id}")
    void deleteFormDataById(Long id);
}
