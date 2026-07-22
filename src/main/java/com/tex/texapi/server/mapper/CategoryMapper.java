package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Category;
import com.tex.texapi.pojo.vo.CategoryVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CategoryMapper {

    /**
     * 根据项目id获取分类列表
     * @param projectId
     * @return
     */
    @Select("select * from category where project_id= #{projectId}")
    List<CategoryVO> getVoByProjectId(Long projectId);

    /**
     * 新增分类
     * @param category
     */
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
    @Select("select * from category where parent_id=#{parentId}")
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
    @Select("select * from category where id=#{id}")
    Category getById(Long id);
}
