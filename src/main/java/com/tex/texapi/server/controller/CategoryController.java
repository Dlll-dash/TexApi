package com.tex.texapi.server.controller;

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

    @GetMapping("/{projecId}")
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.PROJECT)
    public Result<CategoryVO>getCategories(@PathVariable Long projecId){
        log.info("获取分类：{}",projecId);
        CategoryVO categoryVO = categoryService.getCategories(projecId);
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

}
