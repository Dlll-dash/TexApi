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
     * 根据项目id获取当前用户的草稿列表
     * @param projectId
     * @param userId
     * @return
     */
    List<Api> listDrafts(@Param("projectId") Long projectId, @Param("userId") Long userId);

    /**
     * 根据项目id获取主表API列表
     * @param projectId
     * @return
     */
    List<Api> listMasters(Long projectId);

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
     * 获取主表API
     * @param id
     * @return
     */
    Api getMaster(Long id);

    /**
     * 根据baseId和用户获取草稿
     * @param baseId
     * @param userId
     * @return
     */
    @Select("select * from api where base_id=#{baseId} and create_user=#{userId} and is_draft = 1")
    Api getDraftByBaseId(@Param("baseId") Long baseId, @Param("userId") Long userId);

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
    @Delete("delete from api where id=#{id} and is_draft = 1")
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
    List<Long> filterAccessibleApiIds(@Param("ids") List<Long> ids, @Param("userId") Long userId);

    /**
     * 更新主表（发布时使用）
     * @param api
     */
    void updateMaster(Api api);

    /**
     * 回填草稿的base_id（首次发布后）
     */
    void updateDraftBaseId(@Param("draftId") Long draftId, @Param("baseId") Long baseId);

    /**
     * 鉴权查询：一次 JOIN 返回用户在接口所属团队中的角色，无权限返回 null
     */
    Integer getUserRole(@Param("apiId") Long apiId, @Param("userId") Long userId);
}
