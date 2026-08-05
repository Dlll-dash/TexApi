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

    /**
     * 获取草稿+主表合并后的分类树（编辑页面使用）
     * @param projectId
     * @return
     */
    CategoryVO listDrafts(Long projectId);

    /**
     * 发布一个分类及其祖先链（单 API 发布时自动调用）
     * @param userId
     * @param draftCategoryId
     */
    void publishCategoryPath(Long userId, Long draftCategoryId);

    /**
     * 发布一个分类子树下的所有草稿 API（分类右键发布，API 发布会自动处理分类）
     * @param userId
     * @param draftCategoryId
     */
    void publishCategorySubtree(Long userId, Long draftCategoryId);

    /**
     * 丢弃用户在某项目下的所有草稿分类
     * @param userId
     * @param projectId
     */
    void discardCategories(Long userId, Long projectId);

    /**
     * 将主表分类 ID 解析为当前用户的草稿分类 ID（无草稿则返回原 ID）
     */
    Long resolveToDraftId(Long masterCategoryId);

    /**
     * 将草稿分类 ID 解析为主表分类 ID（无主表则返回原 ID）
     */
    Long resolveToMasterId(Long draftCategoryId);
}
