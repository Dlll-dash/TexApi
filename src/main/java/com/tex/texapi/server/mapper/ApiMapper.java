package com.tex.texapi.server.mapper;

import com.tex.texapi.common.constant.AutoFillConstant;
import com.tex.texapi.common.enumeration.OperationType;
import com.tex.texapi.pojo.dto.AddApiDTO;
import com.tex.texapi.pojo.dto.UpdateApiDTO;
import com.tex.texapi.pojo.dto.UpdateApiInfoDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.vo.ApiVO;
import com.tex.texapi.server.annotation.AutoFill;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Mapper
public interface ApiMapper {

    /**
     * 添加接口
     *
     * @param apiDTO
     */
    @AutoFill(OperationType.INSERT)
    void addApi(AddApiDTO apiDTO);

    /**
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    //@Select("select * from api where project_id=#{id} order by status desc")
    List<Api> list(Long id);

    /**
     * 更新api信息
     * @param updateApiDTO
     */
    @AutoFill(OperationType.UPDATE)
    void updateApi(UpdateApiDTO updateApiDTO);

    /**
     * 根据id获取api
     * @param id
     * @return
     */
    @Select("select * from api where id=#{id}")
    Api getById(Long id);

    /**
     * 更新接口信息
     * @param updateApiInfoDTO
     */
    @AutoFill(OperationType.UPDATE)
    void updateInfo(UpdateApiInfoDTO updateApiInfoDTO);

    /**
     * 删除接口
     * @param id
     */
    @Delete("delete from api where id=#{id}")
    void deleteById(Long id);

    /**
     * 根据分类ids批量删除接口
     * @param categoryIds
     */
    void deleteBatchByCategoryId(List<Long> categoryIds);

    /**
     * 根据分类id获取接口列表
     * @param categoryId
     * @return
     */
    List<ApiVO> getByCategoryId(Long categoryId);

    /**
     * 批量鉴权：返回用户有权限访问的 API ID 子集
     */
    @Select("<script>SELECT a.id FROM api a " +
            "JOIN project p ON a.project_id = p.id " +
            "JOIN team_member tm ON p.team_id = tm.team_id " +
            "WHERE a.id IN <foreach collection='ids' item='id' open='(' separator=',' close=')'>#{id}</foreach> " +
            "AND tm.user_id = #{userId}</script>")
    List<Long> filterAccessibleApiIds(@Param("ids") List<Long> ids, @Param("userId") Long userId);

    /**
     * 鉴权查询：一次 JOIN 返回用户在接口所属团队中的角色，无权限返回 null
     */
    @Select("SELECT tm.role FROM team_member tm " +
            "JOIN project p ON tm.team_id = p.team_id " +
            "JOIN api a ON a.project_id = p.id " +
            "WHERE a.id = #{apiId} AND tm.user_id = #{userId}")
    Integer getUserRole(@Param("apiId") Long apiId, @Param("userId") Long userId);
}
