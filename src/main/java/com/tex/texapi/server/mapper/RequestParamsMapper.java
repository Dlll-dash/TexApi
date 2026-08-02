package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.pojo.vo.ExportParamVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
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
     * @param apiId 接口id
     * @param formatType
     * @return
     */
    @Select("select * from request_params where api_id=#{apiId} and format_type=#{formatType}")
    List<Params> getParams(Long apiId, String formatType);

    /**
     * 修改请求参数
     *
     * @param param
     */
    void updateParam(Params param);

    /**
     * 根据id删除请求参数
     * @param id
     */
    @Delete("delete from request_params where id = #{id}")
    void deleteParamById(Long id);

    /**
     * 根据接口id删除请求参数
     * @param apiId
     */
    @Delete("delete from request_params where api_id = #{apiId}")
    void deleteByApiId(Long apiId);

    @Select("select * from request_params where api_id=#{apiId} and format_type=#{formatType}")
    List<ExportParamVO> getExportParams(Long apiId,String formatType);

    /**
     * 根据id获取请求参数
     * @param id
     * @return
     */
    @Select("select * from request_params where id=#{id}")
    Params getById(Long id);

    /**
     * 鉴权查询：一次 JOIN 返回用户在参数所属团队中的角色，无权限返回 null
     */
    @Select("SELECT tm.role FROM team_member tm " +
            "JOIN project p ON tm.team_id = p.team_id " +
            "JOIN api a ON a.project_id = p.id " +
            "JOIN request_params rp ON rp.api_id = a.id " +
            "WHERE rp.id = #{paramId} AND tm.user_id = #{userId}")
    Integer getUserRole(@Param("paramId") Long paramId, @Param("userId") Long userId);
}