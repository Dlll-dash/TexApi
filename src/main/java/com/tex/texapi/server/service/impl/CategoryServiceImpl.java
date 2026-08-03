package com.tex.texapi.server.service.impl;


import com.tex.texapi.pojo.dto.AddCategoryDTO;
import com.tex.texapi.pojo.dto.UpdateCategoryDTO;
import com.tex.texapi.pojo.entity.Category;
import com.tex.texapi.pojo.vo.AddCategoryVO;
import com.tex.texapi.pojo.vo.ApiVO;
import com.tex.texapi.pojo.vo.CategoryVO;
import com.tex.texapi.server.mapper.ApiMapper;
import com.tex.texapi.server.mapper.CategoryMapper;
import com.tex.texapi.server.service.CategoryService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private ApiMapper apiMapper;

    /**
     * 根据项目id获取分类
     * @param projectId
     * @return
     */
    @Override
    public CategoryVO getCategories(Long projectId) {
        List<CategoryVO> list=categoryMapper.getVoByProjectId(projectId);
        CategoryVO root;

        //id,与parentId，与children
        Map<Long, CategoryVO> map = list.stream().collect(Collectors.toMap(CategoryVO::getId, vo -> vo));
        root=list.stream().filter(vo -> vo.getParentId()==null).findFirst().orElse(null);

        //O(N)构建父子关系树
        map.forEach((id, category) -> {
            if (map.containsKey(category.getParentId())) {
                CategoryVO parentVO = map.get(category.getParentId());
                if (parentVO != null) {
                    if (parentVO.getChildren() == null) {
                        parentVO.setChildren(new ArrayList<>());
                    }
                    parentVO.getChildren().add(category);
                }
            }
        });

        return root;
    }

    /**
     * 新增分类
     * @param addCategoryDTO
     * @return
     */
    @Override
    public AddCategoryVO add(AddCategoryDTO addCategoryDTO) {
        Category category=new Category();
        BeanUtils.copyProperties(addCategoryDTO,category);
        categoryMapper.add(category);

        AddCategoryVO addCategoryVO=new AddCategoryVO();
        BeanUtils.copyProperties(category,addCategoryVO);

        return addCategoryVO;
    }

    /**
     * 更新分类
     * @param id
     * @param updateCategoryDTO
     */
    @Override
    public void update(Long id, UpdateCategoryDTO updateCategoryDTO) {
        Category category=new Category();
        BeanUtils.copyProperties(updateCategoryDTO,category);
        category.setId(id);
        categoryMapper.update(category);
    }

    /**
     * 删除分类及其下的子分类和接口
     * @param id
     */
    @Override
    @Transactional
    public void delete(Long id) {
        //递归删除所有子分类
        Category category = categoryMapper.getById(id);

        Long projectId=category.getProjectId();
        CategoryVO root=getCategories(projectId);
        List ids=new ArrayList<>();

        getAllChildrenId(root,ids);
        //删除所有接口
        apiMapper.deleteBatchByCategoryId(ids);
        //删除分类
        categoryMapper.deleteBatchIds(ids);
    }

    /**
     * 递归获取所有子分类id
     * @param root
     * @param ids
     */
    private void getAllChildrenId(CategoryVO root,List<Long> ids){
        if (root == null) {
            return;
        }
        ids.add(root.getId());
        if (root.getChildren() != null) {
            root.getChildren().forEach(child -> getAllChildrenId(child, ids));
        }
    }

    @Override
    public List<ApiVO> getApiByCategoryId(Long categoryId) {
        return apiMapper.getByCategoryId(categoryId);
    }
}
