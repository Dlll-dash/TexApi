package com.tex.texapi.server.service;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.AddCategoryDTO;
import com.tex.texapi.pojo.dto.UpdateCategoryDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.vo.AddCategoryVO;
import com.tex.texapi.pojo.vo.ApiVO;
import com.tex.texapi.pojo.vo.CategoryVO;

import java.util.List;

public interface CategoryService {
    /**
     * 根据项目id递归获取分类根节点
     *
     * @param projecId
     * @return CategoryVO
     */
    CategoryVO getCategories(Long projecId);

    /**
     * 新增分类
     * @param addCategoryDTO
     * @return
     */
    AddCategoryVO add(AddCategoryDTO addCategoryDTO);

    /**
     * 更新分类
     * @param id
     * @param updateCategoryDTO
     */
    void update(Long id, UpdateCategoryDTO updateCategoryDTO);

    /**
     * 删除分类
     * @param id
     */
    void delete(Long id);

    /**
     * 根据分类获取接口列表
     * @param categoryId
     * @return
     */
    List<ApiVO> getApiByCategoryId(Long categoryId);
}
