package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.AddCategoryDTO;
import com.tex.texapi.pojo.dto.UpdateCategoryDTO;
import com.tex.texapi.pojo.vo.AddCategoryVO;
import com.tex.texapi.pojo.vo.CategoryVO;
import com.tex.texapi.server.service.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tex/categories")
@Slf4j
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping("/{projecId}")
    public Result<CategoryVO>getCategories(@PathVariable Long projecId){
        log.info("获取分类：{}",projecId);
        CategoryVO categoryVO = categoryService.getCategories(projecId);
        return Result.success(categoryVO);
    }

    @PostMapping
    public Result<AddCategoryVO>add(@RequestBody AddCategoryDTO addCategoryDTO){
        log.info("添加分类：{}",addCategoryDTO);
        AddCategoryVO addCategoryVO = categoryService.add(addCategoryDTO);
        return Result.success(addCategoryVO);
    }

    @PutMapping("/{id}")
    public Result update(@PathVariable Long id,@RequestBody UpdateCategoryDTO updateCategoryDTO){
        log.info("更新分类：{}",updateCategoryDTO);
        categoryService.update(id,updateCategoryDTO);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result delete(@PathVariable Long id){
        log.info("删除分类；{}",id);
        categoryService.delete(id);
        return Result.success();
    }



}
