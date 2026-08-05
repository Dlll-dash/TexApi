package com.tex.texapi.server.service;

import com.tex.texapi.pojo.dto.*;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.vo.AddApiVO;
import com.tex.texapi.pojo.vo.ApiVO;
import com.tex.texapi.pojo.vo.ExportBatchVO;
import com.tex.texapi.pojo.vo.RequestVO;

import java.util.List;

public interface ApiService {
    /**
     * 获取当前用户的草稿列表（自动补齐）
     * @param projectId
     * @return
     */
    List<Api> listDrafts(Long projectId);

    /**
     * 查看主表API（只读）
     * @param masterId
     * @return
     */
    Api getMaster(Long masterId);

    /**
     * 更新草稿信息
     * @param updateApiDTO
     */
    void updateApi(UpdateApiDTO updateApiDTO);

    /**
     * 向指定接口发送请求（使用草稿参数）
     *
     * @param requestDTO
     * @return
     */
    RequestVO send(RequestDTO requestDTO);

    /**
     * 更新草稿基本信息
     * @param updateApiInfoDTO
     */
    void updateInfo(UpdateApiInfoDTO updateApiInfoDTO);

    /**
     * 添加接口（创建主表骨架 + 草稿）
     *
     * @param apiDTO
     * @return
     */
    AddApiVO addApi(AddApiDTO apiDTO);

    /**
     * 删除草稿
     * @param id
     */
    void delete(Long id);

    /**
     * 发布草稿（覆盖主表）
     * @param draftId
     * @param expectedMasterUpdateTime
     */
    void publish(Long draftId, String expectedMasterUpdateTime);

    /**
     * 批量发布指定分类集合下的所有草稿 API（用于分类发布时级联发布接口）
     * @param projectId
     * @param userId
     * @param draftCategoryIds 草稿分类 ID 集合
     */
    void publishDraftsUnderCategories(Long projectId, Long userId, List<Long> draftCategoryIds);

    /**
     * 放弃草稿
     * @param draftId
     */
    void discardDraft(Long draftId);

    /**
     * 获取项目下所有已发布（主表）API列表
     * @param projectId
     * @return
     */
    List<Api> listMasterApis(Long projectId);

    /**
     * 批量导出接口
     * @param list
     * @return
     */
    List<ExportBatchVO> exportBatch(List<ExportBatchDTO> list);
}
