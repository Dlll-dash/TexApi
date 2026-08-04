package com.tex.texapi.server.mapper;

import com.tex.texapi.common.enumeration.OperationType;
import com.tex.texapi.pojo.entity.Category;
import com.tex.texapi.pojo.vo.CategoryVO;
import com.tex.texapi.server.annotation.AutoFill;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
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
     * 鉴权查询：一次 JOIN 返回用户在分类所属团队中的角色，无权限返回 null
     */
    Integer getUserRole(@Param("categoryId") Long categoryId, @Param("userId") Long userId);
}
