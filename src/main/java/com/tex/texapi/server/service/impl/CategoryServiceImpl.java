package com.tex.texapi.server.service.impl;


import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.exception.RequestException;
import com.tex.texapi.pojo.dto.AddCategoryDTO;
import com.tex.texapi.pojo.dto.UpdateCategoryDTO;
import com.tex.texapi.pojo.entity.Category;
import com.tex.texapi.pojo.vo.AddCategoryVO;
import com.tex.texapi.pojo.vo.ApiVO;
import com.tex.texapi.pojo.vo.CategoryVO;
import com.tex.texapi.server.mapper.ApiMapper;
import com.tex.texapi.server.mapper.CategoryMapper;
import com.tex.texapi.server.service.ApiService;
import com.tex.texapi.server.service.CategoryService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private ApiMapper apiMapper;
    @Autowired
    @org.springframework.context.annotation.Lazy
    private ApiService apiService;

    // ==================== Read Operations ====================

    /**
     * 根据项目id获取主表分类树（只读，供主表浏览页使用）
     */
    @Override
    public CategoryVO getCategories(Long projectId) {
        List<CategoryVO> list = categoryMapper.getVoByProjectId(projectId);
        return buildTree(list);
    }

    /**
     * 获取草稿+主表合并后的分类树（编辑页面使用）
     * 优化：批量插入自动补齐的草稿，替代逐个 insert
     */
    @Override
    public CategoryVO listDrafts(Long projectId) {
        Long userId = BaseContext.getCurrentId();

        // 1. 加载主表和用户草稿（各 1 条查询）
        List<Category> masters = categoryMapper.getMastersByProjectId(projectId);
        List<Category> drafts = categoryMapper.listDrafts(projectId, userId);

        // 2. 构建 baseId → draft 索引
        Map<Long, Category> draftByBaseId = new HashMap<>();
        for (Category draft : drafts) {
            if (draft.getBaseId() != null) {
                draftByBaseId.put(draft.getBaseId(), draft);
            }
        }

        // 3. 按深度排序主表，为缺失草稿的主表自动补齐
        List<Category> sortedMasters = sortByDepth(masters);
        Map<Long, Long> masterToDraftId = new HashMap<>();

        for (Category draft : drafts) {
            if (draft.getBaseId() != null) {
                masterToDraftId.put(draft.getBaseId(), draft.getId());
            }
        }

        for (Category master : sortedMasters) {
            if (!draftByBaseId.containsKey(master.getId())) {
                Category draft = buildDraftFromMaster(master, userId, masterToDraftId);
                categoryMapper.add(draft);  // 单条 INSERT（auto-create 通常很少）
                drafts.add(draft);
                draftByBaseId.put(master.getId(), draft);
                masterToDraftId.put(master.getId(), draft.getId());
            }
        }

        // 5. 构建合并 VO 列表
        Set<Long> draftIdSet = drafts.stream().map(Category::getId).collect(Collectors.toSet());
        List<CategoryVO> merged = new ArrayList<>();

        for (Category master : masters) {
            Category draft = draftByBaseId.get(master.getId());
            if (draft != null && Boolean.TRUE.equals(draft.getMarkDeleted())) {
                continue; // 标记删除，跳过
            }
            Category source = (draft != null) ? draft : master;
            merged.add(toCategoryVO(source, draftIdSet.contains(source.getId())));
        }

        // 纯新增草稿（baseId == null）
        for (Category draft : drafts) {
            if (draft.getBaseId() == null && !Boolean.TRUE.equals(draft.getMarkDeleted())) {
                merged.add(toCategoryVO(draft, true));
            }
        }

        return buildTree(merged);
    }

    // ==================== Write Operations ====================

    @Override
    public AddCategoryVO add(AddCategoryDTO addCategoryDTO) {
        Long userId = BaseContext.getCurrentId();
        Category category = new Category();
        BeanUtils.copyProperties(addCategoryDTO, category);
        category.setIsDraft(true);
        category.setBaseId(null);
        category.setVersion(0L);
        category.setCreateUser(userId);

        // 父分类是主表 → 找或创建草稿父分类
        if (addCategoryDTO.getParentId() != null) {
            Category parent = categoryMapper.getById(addCategoryDTO.getParentId());
            if (parent != null && !Boolean.TRUE.equals(parent.getIsDraft())) {
                Category draftParent = categoryMapper.getDraftByBaseId(parent.getId(), userId);
                if (draftParent == null) {
                    draftParent = buildDraftFromMaster(parent, userId, new HashMap<>());
                    categoryMapper.add(draftParent);
                }
                category.setParentId(draftParent.getId());
            }
        }

        categoryMapper.add(category);

        AddCategoryVO addCategoryVO = new AddCategoryVO();
        BeanUtils.copyProperties(category, addCategoryVO);
        return addCategoryVO;
    }

    @Override
    public void update(Long id, UpdateCategoryDTO updateCategoryDTO) {
        Long userId = BaseContext.getCurrentId();
        Category existing = categoryMapper.getByIdAny(id);
        if (existing == null) {
            throw new RequestException("分类不存在");
        }

        Category target;
        if (Boolean.TRUE.equals(existing.getIsDraft())) {
            target = existing;
        } else {
            Category draft = categoryMapper.getDraftByBaseId(existing.getId(), userId);
            if (draft == null) {
                draft = buildDraftFromMaster(existing, userId, new HashMap<>());
                categoryMapper.add(draft);
            }
            target = draft;
        }

        target.setName(updateCategoryDTO.getName());
        if (updateCategoryDTO.getParentId() != null) {
            target.setParentId(updateCategoryDTO.getParentId());
        }
        categoryMapper.updateDraft(target);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Long userId = BaseContext.getCurrentId();
        Category existing = categoryMapper.getByIdAny(id);
        if (existing == null) {
            throw new RequestException("分类不存在");
        }

        if (Boolean.TRUE.equals(existing.getIsDraft())) {
            if (existing.getBaseId() == null) {
                // 纯草稿：加载全部草稿到内存，BFS 收集子孙，IN 批量删除
                List<Category> allDrafts = categoryMapper.listDrafts(existing.getProjectId(), userId);
                List<Long> ids = collectDraftDescendantIds(allDrafts, id);
                apiMapper.deleteBatchByCategoryId(ids);
                categoryMapper.deleteBatchIds(ids);
            } else {
                // 已发布过 → 标记删除
                existing.setMarkDeleted(true);
                categoryMapper.updateDraft(existing);
            }
        } else {
            // 主表 → 创建或找到草稿，标记删除
            Category draft = categoryMapper.getDraftByBaseId(existing.getId(), userId);
            if (draft == null) {
                draft = buildDraftFromMaster(existing, userId, new HashMap<>());
                categoryMapper.add(draft);
            }
            draft.setMarkDeleted(true);
            categoryMapper.updateDraft(draft);
        }
    }

    // ==================== Publish / Discard ====================

    /**
     * 发布指定的草稿分类 ID 集合到主表（作用域发布的核心方法）
     */
    @Transactional
    public void publishCategoryIds(Long userId, Long projectId, List<Long> targetDraftIds) {
        if (targetDraftIds == null || targetDraftIds.isEmpty()) return;

        Set<Long> targetSet = new HashSet<>(targetDraftIds);

        // 加载用户草稿和主表
        List<Category> drafts = categoryMapper.listDrafts(projectId, userId);
        if (drafts.isEmpty()) return;

        List<Category> allMasters = categoryMapper.getMastersByProjectId(projectId);
        Map<Long, Category> masterById = new HashMap<>();
        for (Category m : allMasters) { masterById.put(m.getId(), m); }

        // 只处理 targetSet 中的草稿
        List<Category> newDrafts = new ArrayList<>();
        List<Category> updateDrafts = new ArrayList<>();
        List<Category> deleteDrafts = new ArrayList<>();
        for (Category d : drafts) {
            if (!targetSet.contains(d.getId())) continue; // ← 过滤
            if (Boolean.TRUE.equals(d.getMarkDeleted())) {
                deleteDrafts.add(d);
            } else if (d.getBaseId() == null) {
                newDrafts.add(d);
            } else {
                updateDrafts.add(d);
            }
        }

        // 1. 批量创建新 master
        List<Category> newMasters = new ArrayList<>();
        for (Category nd : newDrafts) {
            Category m = new Category();
            BeanUtils.copyProperties(nd, m);
            m.setId(null); m.setIsDraft(false); m.setBaseId(null);
            m.setVersion(0L); m.setMarkDeleted(false);
            newMasters.add(m);
        }
        if (!newMasters.isEmpty()) categoryMapper.insertBatch(newMasters);

        Map<Long, Long> draftToMaster = new HashMap<>();
        for (int i = 0; i < newDrafts.size(); i++) {
            Category nd = newDrafts.get(i);
            Category nm = newMasters.get(i);
            if (nm.getId() != null) {
                categoryMapper.batchUpdateDraftBaseId(nd.getId(), nm.getId());
                draftToMaster.put(nd.getId(), nm.getId());
            }
        }

        // 2. 更新已有主表 name
        for (Category ud : updateDrafts) {
            Category master = masterById.get(ud.getBaseId());
            if (master != null) {
                master.setName(ud.getName());
                categoryMapper.updateMaster(master);
            }
            draftToMaster.put(ud.getId(), ud.getBaseId());
        }

        // 3. 修正 parent_id
        List<Category> allNonDeleted = new ArrayList<>();
        allNonDeleted.addAll(newDrafts);
        allNonDeleted.addAll(updateDrafts);
        for (Category draft : allNonDeleted) {
            if (draft.getParentId() == null) continue;
            //获取草稿的主表id
            Long masterId = draftToMaster.get(draft.getId());
            if (masterId == null) continue;
            //获取草稿的父分类的主表id
            Long resolvedParentId = draftToMaster.getOrDefault(draft.getParentId(), draft.getParentId());
            if (draft.getBaseId() != null) {
                Category m = masterById.get(masterId);
                //确认父分类主表已存在
                if (m != null && !Objects.equals(m.getParentId(), resolvedParentId)) {
                    //更新草稿的主表的parentId指向草稿父分类的主表id
                    categoryMapper.batchUpdateMasterParentId(masterId, resolvedParentId);
                }
            }
        }
        for (int i = 0; i < newDrafts.size(); i++) {
            Category nd = newDrafts.get(i);
            if (nd.getParentId() == null) continue;
            Long masterId = draftToMaster.get(nd.getId());
            if (masterId == null) continue;
            Long resolvedParentId = draftToMaster.getOrDefault(nd.getParentId(), nd.getParentId());
            if (!Objects.equals(nd.getParentId(), resolvedParentId)) {
                categoryMapper.batchUpdateMasterParentId(masterId, resolvedParentId);
            }
        }

        // 4. 处理标记删除
        List<Long> deletedMasterIds = new ArrayList<>();
        List<Long> deletedDraftIds = new ArrayList<>();
        for (Category dd : deleteDrafts) {
            deletedDraftIds.add(dd.getId());
            if (dd.getBaseId() != null && masterById.containsKey(dd.getBaseId())) {
                collectMasterDescendantIds(allMasters, dd.getBaseId(), deletedMasterIds);
            }
        }
        if (!deletedDraftIds.isEmpty()) categoryMapper.deleteBatchIds(deletedDraftIds);
        if (!deletedMasterIds.isEmpty()) {
            Set<Long> unique = new LinkedHashSet<>(deletedMasterIds);
            List<Long> idList = new ArrayList<>(unique);
            apiMapper.deleteBatchByCategoryId(idList);
            categoryMapper.deleteBatchIds(idList);
        }
    }

    @Override
    @Transactional
    public void publishCategoryPath(Long userId, Long draftCategoryId) {
        if (draftCategoryId == null) return;
        // 向上追溯祖先链，收集所有需要发布的草稿分类 ID
        List<Long> pathIds = new ArrayList<>();
        Long currentId = draftCategoryId;
        while (currentId != null) {
            Category c = categoryMapper.getByIdAny(currentId);
            if (c == null || !Boolean.TRUE.equals(c.getIsDraft())) break;
            pathIds.add(currentId);
            currentId = c.getParentId();
        }
        if (!pathIds.isEmpty()) {
            Category cat = categoryMapper.getByIdAny(draftCategoryId);
            publishCategoryIds(userId, cat.getProjectId(), pathIds);
        }
    }

    @Override
    @Transactional
    public void publishCategorySubtree(Long userId, Long draftCategoryId) {
        // 发布子树下所有草稿 API（每个 API 发布时会自动发布其祖先分类）
        Category cat = categoryMapper.getByIdAny(draftCategoryId);
        if (cat == null) return;
        Long projectId = cat.getProjectId();
        List<Category> allDrafts = categoryMapper.listDrafts(projectId, userId);
        List<Long> subtreeIds = collectDraftDescendantIds(allDrafts, draftCategoryId);
        apiService.publishDraftsUnderCategories(projectId, userId, subtreeIds);
    }

    @Override
    @Transactional
    public void discardCategories(Long userId, Long projectId) {
        List<Category> drafts = categoryMapper.listDrafts(projectId, userId);
        List<Long> draftIds = drafts.stream().map(Category::getId).toList();
        if (!draftIds.isEmpty()) {
            apiMapper.deleteBatchByCategoryId(draftIds);
        }
        categoryMapper.deleteDraftsByUser(projectId, userId);
    }

    @Override
    public List<ApiVO> getApiByCategoryId(Long categoryId) {
        return apiMapper.getByCategoryId(categoryId);
    }

    @Override
    public Long resolveToDraftId(Long masterCategoryId) {
        if (masterCategoryId == null) return null;
        Long userId = BaseContext.getCurrentId();
        Category draft = categoryMapper.getDraftByBaseId(masterCategoryId, userId);
        //System.out.println("resolveToDraftId: masterCatId=" + masterCategoryId + ", userId=" + userId + ", found=" + (draft != null ? draft.getId() : "null") + ", return=" + (draft != null ? draft.getId() : masterCategoryId));
        return draft != null ? draft.getId() : masterCategoryId;
    }

    @Override
    public Long resolveToMasterId(Long draftCategoryId) {
        if (draftCategoryId == null) return null;
        Category cat = categoryMapper.getByIdAny(draftCategoryId);
        if (cat != null && Boolean.TRUE.equals(cat.getIsDraft()) && cat.getBaseId() != null) {
            return cat.getBaseId();
        }
        return draftCategoryId;
    }

    // ==================== Private Helpers ====================

    /**
     * 从主表构建草稿对象（不执行 insert，由调用方决定批量/单条写入）
     */
    private Category buildDraftFromMaster(Category master, Long userId, Map<Long, Long> masterToDraftId) {
        Category draft = new Category();
        BeanUtils.copyProperties(master, draft);
        draft.setId(null);
        draft.setIsDraft(true);
        draft.setBaseId(master.getId());
        draft.setVersion(0L);
        draft.setCreateUser(userId);
        draft.setMarkDeleted(false);

        if (master.getParentId() != null && masterToDraftId.containsKey(master.getParentId())) {
            draft.setParentId(masterToDraftId.get(master.getParentId()));
        }

        return draft;
    }

    private CategoryVO toCategoryVO(Category category, boolean isDraft) {
        CategoryVO vo = new CategoryVO();
        BeanUtils.copyProperties(category, vo);
        vo.setIsDraft(isDraft);
        vo.setCreateUser(category.getCreateUser());
        return vo;
    }

    private CategoryVO buildTree(List<CategoryVO> list) {
        if (list.isEmpty()) return null;

        Map<Long, CategoryVO> map = list.stream()
                .collect(Collectors.toMap(CategoryVO::getId, vo -> vo));

        CategoryVO root = list.stream()
                .filter(vo -> vo.getParentId() == null)
                .findFirst().orElse(null);

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

    // ==================== In-Memory Tree Helpers (0 DB queries) ====================

    /**
     * BFS 深度排序（内存内，不查 DB）
     */
    private List<Category> sortByDepth(List<Category> flatList) {
        if (flatList.isEmpty()) return flatList;

        Map<Long, List<Category>> childrenMap = new HashMap<>();
        Category root = null;
        for (Category c : flatList) {
            if (c.getParentId() == null) {
                root = c;
            } else {
                childrenMap.computeIfAbsent(c.getParentId(), k -> new ArrayList<>()).add(c);
            }
        }

        List<Category> sorted = new ArrayList<>();
        if (root == null) return flatList;

        Queue<Category> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            Category current = queue.poll();
            sorted.add(current);
            List<Category> children = childrenMap.getOrDefault(current.getId(), Collections.emptyList());
            queue.addAll(children);
        }
        return sorted;
    }

    /**
     * 从已加载的草稿列表中收集子孙 ID（纯内存操作，不查 DB）
     */
    private List<Long> collectDraftDescendantIds(List<Category> allDrafts, Long rootId) {
        // 构建 parentId → children 映射
        Map<Long, List<Category>> childrenMap = new HashMap<>();
        for (Category c : allDrafts) {
            if (c.getParentId() != null) {
                childrenMap.computeIfAbsent(c.getParentId(), k -> new ArrayList<>()).add(c);
            }
        }

        List<Long> ids = new ArrayList<>();
        ids.add(rootId);
        Queue<Long> queue = new LinkedList<>();
        queue.add(rootId);
        while (!queue.isEmpty()) {
            Long currentId = queue.poll();
            List<Category> children = childrenMap.getOrDefault(currentId, Collections.emptyList());
            for (Category child : children) {
                ids.add(child.getId());
                queue.add(child.getId());
            }
        }
        return ids;
    }

    /**
     * 从已加载的主表列表中收集子孙 ID（纯内存操作，不查 DB）
     */
    private void collectMasterDescendantIds(List<Category> allMasters, Long rootId, List<Long> out) {
        Map<Long, List<Category>> childrenMap = new HashMap<>();
        for (Category c : allMasters) {
            if (c.getParentId() != null) {
                childrenMap.computeIfAbsent(c.getParentId(), k -> new ArrayList<>()).add(c);
            }
        }

        out.add(rootId);
        Queue<Long> queue = new LinkedList<>();
        queue.add(rootId);
        while (!queue.isEmpty()) {
            Long currentId = queue.poll();
            List<Category> children = childrenMap.getOrDefault(currentId, Collections.emptyList());
            for (Category child : children) {
                out.add(child.getId());
                queue.add(child.getId());
            }
        }
    }

}
