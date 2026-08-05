package com.tex.texapi.server.mapper;

import com.tex.texapi.common.enumeration.OperationType;
import com.tex.texapi.pojo.entity.Category;
import com.tex.texapi.pojo.vo.CategoryVO;
import com.tex.texapi.server.annotation.AutoFill;
import org.apache.ibatis.annotations.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper
public interface CategoryMapper {

    /**
     * 根据项目id获取分类列表
     * @param projectId
     * @return
     */
    @Select("select * from category where project_id= #{projectId} and is_draft = 0")
    List<CategoryVO> getVoByProjectId(Long projectId);

    /**
     * 新增分类
     * @param category
     */
    @AutoFill(OperationType.INSERT)
    void add(Category category);

    /**
     * 更新分类
     * @param category
     */
    void update(Category category);

    /**
     * 删除分类
     * @param id
     */
    @Delete("delete from category where id=#{id}")
    void delete(Long id);

    /**
     * 根据父分类id获取分类列表
     * @param parentId
     * @return
     */
    @Select("select * from category where parent_id=#{parentId} and is_draft = 0")
    List<Category> getByParentId(Long parentId);

    /**
     * 批量删除
     * @param ids
     */
    void deleteBatchIds(List ids);

    /**
     * 通过id获取分类
     * @param id
     * @return
     */
    @Select("select * from category where id=#{id} and is_draft = 0")
    Category getById(Long id);

    /**
     * 通过id获取分类（不限制is_draft，用于草稿操作）
     */
    @Select("select * from category where id=#{id}")
    Category getByIdAny(Long id);

    /**
     * 获取用户在某项目下的草稿分类列表
     */
    @Select("select * from category where project_id = #{projectId} and is_draft = 1 and create_user = #{userId}")
    List<Category> listDrafts(@Param("projectId") Long projectId, @Param("userId") Long userId);

    /**
     * 根据baseId获取用户的草稿分类
     */
    @Select("select * from category where base_id = #{baseId} and create_user = #{userId} and is_draft = 1")
    Category getDraftByBaseId(@Param("baseId") Long baseId, @Param("userId") Long userId);

    /**
     * 获取主表分类列表（实体，非VO）
     */
    @Select("select * from category where project_id = #{projectId} and is_draft = 0")
    List<Category> getMastersByProjectId(Long projectId);

    /**
     * 更新草稿分类
     */
    void updateDraft(Category category);

    /**
     * 更新主表分类（发布用）
     */
    void updateMaster(Category category);

    /**
     * 回填草稿base_id（首次发布后）
     */
    @Update("update category set base_id = #{baseId} where id = #{draftId} and is_draft = 1")
    void updateDraftBaseId(@Param("draftId") Long draftId, @Param("baseId") Long baseId);

    /**
     * 删除用户在某项目下的所有草稿分类
     */
    @Delete("delete from category where project_id = #{projectId} and is_draft = 1 and create_user = #{userId}")
    void deleteDraftsByUser(@Param("projectId") Long projectId, @Param("userId") Long userId);

    /**
     * 批量插入分类（返回后每个元素有自增ID）
     */
    void insertBatch(List<Category> list);

    /**
     * 单条回填草稿base_id（MyBatis无法批量处理不同值的UPDATE）
     */
    void batchUpdateDraftBaseId(@Param("draftId") Long draftId, @Param("baseId") Long baseId);

    /**
     * 更新主表parent_id（发布时修正父分类引用）
     */
    void batchUpdateMasterParentId(@Param("id") Long id, @Param("parentId") Long parentId);

    /**
     * 鉴权查询：一次 JOIN 返回用户在分类所属团队中的角色，无权限返回 null
     */
    Integer getUserRole(@Param("categoryId") Long categoryId, @Param("userId") Long userId);
}
