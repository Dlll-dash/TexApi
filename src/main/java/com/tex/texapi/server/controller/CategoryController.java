package com.tex.texapi.server.controller;

import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.enumeration.CheckType;
import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.AddCategoryDTO;
import com.tex.texapi.pojo.dto.UpdateCategoryDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.pojo.vo.AddCategoryVO;
import com.tex.texapi.pojo.vo.ApiVO;
import com.tex.texapi.pojo.vo.CategoryVO;
import com.tex.texapi.server.annotation.TeamAuth;
import com.tex.texapi.server.service.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tex/categories")
@Slf4j
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * 获取主表分类树（只读，供主表浏览页使用）
     */
    @GetMapping("/{projecId}")
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.PROJECT)
    public Result<CategoryVO>getCategories(@PathVariable Long projecId){
        log.info("获取主表分类：{}",projecId);
        CategoryVO categoryVO = categoryService.getCategories(projecId);
        return Result.success(categoryVO);
    }

    /**
     * 获取草稿+主表合并分类树（编辑页面使用）
     */
    @GetMapping("/drafts/{projectId}")
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.PROJECT)
    public Result<CategoryVO>listDrafts(@PathVariable Long projectId){
        log.info("获取草稿分类树：{}",projectId);
        CategoryVO categoryVO = categoryService.listDrafts(projectId);
        return Result.success(categoryVO);
    }

    @PostMapping
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.PROJECT)
    public Result<AddCategoryVO>add(@RequestBody AddCategoryDTO addCategoryDTO){
        log.info("添加分类：{}",addCategoryDTO);
        AddCategoryVO addCategoryVO = categoryService.add(addCategoryDTO);
        return Result.success(addCategoryVO);
    }

    @PutMapping("/{id}")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.CATEGORY)
    public Result update(@PathVariable Long id,@RequestBody UpdateCategoryDTO updateCategoryDTO){
        log.info("更新分类：{}",updateCategoryDTO);
        categoryService.update(id,updateCategoryDTO);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @TeamAuth(level = TeamMember.ADMIN, checkType = CheckType.CATEGORY)
    public Result delete(@PathVariable Long id){
        log.info("删除分类；{}",id);
        categoryService.delete(id);
        return Result.success();
    }

    @GetMapping("/{categoryId}/apis")
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.CATEGORY)
    public Result<List<ApiVO>> getCategoryApi(@PathVariable Long categoryId){
        log.info("获取分类下的接口：{}",categoryId);
        return Result.success(categoryService.getApiByCategoryId(categoryId));
    }

    /**
     * 发布草稿分类到主表
     */
    /**
     * 发布单个分类及其子孙（分类右键发布）
     */
    @PostMapping("/{id}/publish")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.CATEGORY)
    public Result publishSingleCategory(@PathVariable Long id){
        log.info("发布分类及子孙：categoryId={}", id);
        categoryService.publishCategorySubtree(BaseContext.getCurrentId(), id);
        return Result.success();
    }

    /**
     * 丢弃所有草稿分类
     */
    @DeleteMapping("/drafts/{projectId}")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.PROJECT)
    public Result discardCategories(@PathVariable Long projectId){
        log.info("丢弃草稿分类：projectId={}", projectId);
        categoryService.discardCategories(BaseContext.getCurrentId(), projectId);
        return Result.success();
    }

}
