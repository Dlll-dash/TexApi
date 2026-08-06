package com.tex.texapi.server.service.impl;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.exception.NoPermissionException;
import com.tex.texapi.common.exception.RequestException;
import com.tex.texapi.common.utils.HttpClientUtil;
import com.tex.texapi.pojo.dto.*;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.pojo.entity.Request;
import com.tex.texapi.pojo.vo.*;
import com.tex.texapi.server.mapper.ApiMapper;
import com.tex.texapi.server.mapper.RequestParamsMapper;
import com.tex.texapi.server.mapper.ResponseMapper;
import com.tex.texapi.server.service.ApiService;
import com.tex.texapi.server.service.CategoryService;
import okhttp3.*;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ApiServiceImpl implements ApiService {
    @Autowired
    private ApiMapper apiMapper;
    @Autowired
    private RequestParamsMapper requestParamsMapper;
    @Autowired
    private ResponseMapper responseMapper;
    @Autowired
    private RedisTemplate redisTemplate;
    @Autowired
    private CategoryService categoryService;

    /**
     * 获取当前用户的草稿列表（自动补齐）
     * @param projectId
     * @return
     */
    @Override
    public List<Api> listDrafts(Long projectId) {
        Long userId = BaseContext.getCurrentId();

        //查出当前用户已有草稿
        List<Api> drafts = apiMapper.listDrafts(projectId, userId);

        //查出项目下所有主表
        List<Api> masters = apiMapper.listMasters(projectId);

        //修复已有草稿的 categoryId：如果指向主表分类，解析为草稿分类
        for (Api draft : drafts) {
            if (draft.getCategoryId() != null) {
                Long resolved = categoryService.resolveToDraftId(draft.getCategoryId());
                if (!resolved.equals(draft.getCategoryId())) {
                    draft.setCategoryId(resolved);
                    apiMapper.updateApi(draft);
                }
            }
        }

        //为主表中没有草稿的API自动补齐草稿（跳过用户已删除的）
        for (Api master : masters) {
            boolean hasDraft = drafts.stream().anyMatch(d -> master.getId().equals(d.getBaseId()));
            if (!hasDraft) {
                // 检查用户是否之前删除过该草稿（mark_deleted=1）——跳过自动补齐
                Api deleted = apiMapper.getDraftByBaseId(master.getId(), userId);
                if (deleted == null) {
                    Api draft = createDraftFromMaster(master, userId);
                    drafts.add(draft);
                }
            }
        }

        return drafts;
    }

    /**
     * 从主表创建草稿（自动补齐用）
     */
    private Api createDraftFromMaster(Api master, Long userId) {
        //创建草稿API行
        AddApiDTO draftDTO = new AddApiDTO();
        BeanUtils.copyProperties(master, draftDTO);
        draftDTO.setId(null);
        draftDTO.setIsDraft(true);
        draftDTO.setBaseId(master.getId());
        // 将主表 categoryId 解析为草稿 categoryId
        Long originalCatId = master.getCategoryId();
        Long resolvedCatId = categoryService.resolveToDraftId(originalCatId);
        System.out.println("createDraftFromMaster: masterApiId=" + master.getId() + ", originalCatId=" + originalCatId + ", resolvedCatId=" + resolvedCatId);
        draftDTO.setCategoryId(resolvedCatId);
        apiMapper.addApi(draftDTO);
        Long draftId = draftDTO.getId();

        //复制主表params到草稿（批量查询）
        List<Params> masterParams = requestParamsMapper.getAllParams(master.getId());
        if (masterParams != null) {
            for (Params mp : masterParams) {
                Params dp = new Params();
                BeanUtils.copyProperties(mp, dp);
                dp.setId(null);
                dp.setApiId(draftId);
                requestParamsMapper.addParam(dp);
            }
        }

        //复制主表response到草稿
        ResponseVO masterResp = responseMapper.getByApiId(master.getId());
        if (masterResp != null) {
            com.tex.texapi.pojo.entity.Response dr = new com.tex.texapi.pojo.entity.Response();
            BeanUtils.copyProperties(masterResp, dr);
            dr.setId(null);
            dr.setApiId(draftId);
            responseMapper.add(dr);
        }

        //返回草稿实体
        Api draft = new Api();
        BeanUtils.copyProperties(draftDTO, draft);
        draft.setId(draftId);
        return draft;
    }

    /**
     * 查看主表API（只读）
     * @param masterId
     * @return
     */
    @Override
    public Api getMaster(Long masterId) {
        return apiMapper.getMaster(masterId);
    }

    /**
     * 获取项目下所有已发布（主表）API列表
     * @param projectId
     * @return
     */
    @Override
    public List<Api> listMasterApis(Long projectId) {
        return apiMapper.listMasters(projectId);
    }

    /**
     * 添加接口
     * isDraft=true  → 草稿新增（不创建主表，发布时才创建）
     * isDraft=false → 主表新增（直接创建主表骨架）
     * @param addApiDTO
     * @return
     */
    @Override
    @Transactional
    public AddApiVO addApi(AddApiDTO addApiDTO) {
        if (Boolean.TRUE.equals(addApiDTO.getIsDraft())) {
            //草稿新增：不创建主表
            addApiDTO.setBaseId(null);
        } else {
            //主表新增：创建主表骨架
            addApiDTO.setIsDraft(false);
            addApiDTO.setBaseId(null);
        }
        apiMapper.addApi(addApiDTO);

        AddApiVO addApiVO = new AddApiVO();
        BeanUtils.copyProperties(addApiDTO, addApiVO);
        return addApiVO;
    }

    @Override
    public void updateApi(Api api) {
        apiMapper.updateApi(api);
    }

    @Override
    public void updateInfo(UpdateApiInfoDTO updateApiInfoDTO) {
        apiMapper.updateInfo(updateApiInfoDTO);
    }

    /**
     * 发布草稿（覆盖主表）
     * @param draftId
     * @param expectedMasterUpdateTime
     */
    @Override
    @Transactional
    public void publish(Long draftId, String expectedMasterUpdateTime) {
        Api draft = apiMapper.getById(draftId);
        if (draft == null || !Boolean.TRUE.equals(draft.getIsDraft())) {
            throw new RequestException("草稿不存在");
        }

        // 草稿标记已删除 → 直接删除主表
        if (Boolean.TRUE.equals(draft.getMarkDeleted())) {
            Long masterId = draft.getBaseId();
            if (masterId != null) {
                requestParamsMapper.deleteByApiId(masterId);
                responseMapper.deleteByApiId(masterId);
                apiMapper.deleteById(masterId);
            }
            // 删除草稿本身
            requestParamsMapper.deleteByApiId(draftId);
            responseMapper.deleteByApiId(draftId);
            apiMapper.deleteById(draftId);
            return;
        }

        // 只发布该 API 所在分类的祖先链（而非全项目草稿）
        categoryService.publishCategoryPath(draft.getCreateUser(), draft.getCategoryId());

        // 将草稿 categoryId 解析为主表 categoryId
        Long resolvedCategoryId = categoryService.resolveToMasterId(draft.getCategoryId());

        Long masterId = draft.getBaseId();

        if (masterId == null) {
            //首次发布：主表不存在，新建主表
            AddApiDTO masterDTO = new AddApiDTO();
            BeanUtils.copyProperties(draft, masterDTO);
            masterDTO.setId(null);
            masterDTO.setIsDraft(false);
            masterDTO.setBaseId(null);
            masterDTO.setCategoryId(resolvedCategoryId);
            apiMapper.addApi(masterDTO);
            masterId = masterDTO.getId();

            //回填草稿的base_id
            apiMapper.updateDraftBaseId(draftId, masterId);
        } else {
            //再次发布：冲突检测
            Api master = apiMapper.getMaster(masterId);
            if (expectedMasterUpdateTime != null && master.getUpdateTime() != null) {
                LocalDateTime expected = LocalDateTime.parse(expectedMasterUpdateTime);
                if (master.getUpdateTime().isAfter(expected)) {
                    throw new RequestException("自你开始编辑后，主表已被他人更新。是否强制覆盖？");
                }
            }

            //草稿数据覆盖到主表
            Api updateMaster = new Api();
            BeanUtils.copyProperties(draft, updateMaster);
            updateMaster.setId(masterId);
            updateMaster.setIsDraft(false);
            updateMaster.setBaseId(null);
            updateMaster.setCategoryId(resolvedCategoryId);
            apiMapper.updateMaster(updateMaster);
        }

        //同步草稿params到主表（批量查询 + 内存分组 diff，减少 DB 查询）
        List<Params> draftParams = requestParamsMapper.getAllParams(draftId);
        List<Params> masterParams = requestParamsMapper.getAllParams(masterId);
        if (draftParams == null) draftParams = List.of();
        if (masterParams == null) masterParams = List.of();

        //按 name+format_type 构建主表参数索引
        Map<String, Params> masterMap = new java.util.LinkedHashMap<>();
        for (Params mp : masterParams) {
            masterMap.put(mp.getName() + "|" + mp.getFormatType(), mp);
        }

        for (Params dp : draftParams) {
            String key = dp.getName() + "|" + dp.getFormatType();
            Params existing = masterMap.remove(key);
            if (existing != null) {
                //更新已有主表参数（保留ID）
                dp.setId(existing.getId());
                dp.setApiId(masterId);
                requestParamsMapper.updateParam(dp);
            } else {
                //新增主表参数
                dp.setId(null);
                dp.setApiId(masterId);
                requestParamsMapper.addParam(dp);
            }
        }

        //删除草稿中已移除的主表参数
        for (Params remaining : masterMap.values()) {
            requestParamsMapper.deleteParamById(remaining.getId());
        }

        //同步草稿response到主表（保留主表response ID）
        ResponseVO draftResp = responseMapper.getByApiId(draftId);
        ResponseVO masterResp = responseMapper.getByApiId(masterId);
        if (draftResp != null) {
            if (masterResp != null) {
                //更新已有主表response
                com.tex.texapi.pojo.entity.Response mr = new com.tex.texapi.pojo.entity.Response();
                BeanUtils.copyProperties(draftResp, mr);
                mr.setId(masterResp.getId());
                mr.setApiId(masterId);
                responseMapper.update(mr);
            } else {
                //新增主表response
                com.tex.texapi.pojo.entity.Response mr = new com.tex.texapi.pojo.entity.Response();
                BeanUtils.copyProperties(draftResp, mr);
                mr.setId(null);
                mr.setApiId(masterId);
                responseMapper.add(mr);
            }
        }

        //清除Redis缓存
        clearCache("params_" + masterId + "_*");
        clearCache("response_" + masterId + "*");
    }

    /**
     * 批量发布指定分类集合下的所有草稿 API
     */
    @Override
    public void publishDraftsUnderCategories(Long projectId, Long userId, List<Long> draftCategoryIds) {
        if (draftCategoryIds == null || draftCategoryIds.isEmpty()) return;
        List<Api> drafts = apiMapper.listDrafts(projectId, userId);
        for (Api draft : drafts) {
            if (draft.getCategoryId() != null && draftCategoryIds.contains(draft.getCategoryId())) {
                publish(draft.getId(), null);
            }
        }
    }

    /**
     * 放弃草稿
     * @param draftId
     */
    @Override
    @Transactional
    public void discardDraft(Long draftId) {
        //删除草稿params/response
        requestParamsMapper.deleteByApiId(draftId);
        responseMapper.deleteByApiId(draftId);
        //删除草稿行
        apiMapper.deleteById(draftId);
    }

    @Override
    public RequestVO send(RequestDTO requestDTO) {
        //获取api实体（草稿或主表）

        Api api = apiMapper.getById(requestDTO.getApiId());

        //获取url
        String baseUrl = api.getRequestUrl();
        if (baseUrl == null || baseUrl.isEmpty()) {
            throw new RequestException(MessageConstant.URL_EMPTY);
        }

        //判断状态是否为启用
        if (api.getStatus() == Api.MAINTAINING) {
            throw new RequestException(MessageConstant.API_FORBIDDEN);
        }

        //使用草稿ID查参数；若为空则fallback到主表
        Long paramsApiId = requestDTO.getApiId();
        Long fallbackApiId = api.getBaseId(); //如果当前是草稿，baseId指向主表

        //获取Query参数
        String queryKey = "params_" + paramsApiId + "_" + Request.Query;
        List<Params> params = (List<Params>) redisTemplate.opsForValue().get(queryKey);
        if (params == null || params.isEmpty()) {
            params = requestParamsMapper.getParams(paramsApiId, Request.Query);
            if ((params == null || params.isEmpty()) && fallbackApiId != null) {
                params = requestParamsMapper.getParams(fallbackApiId, Request.Query);
            }
            if (params != null && !params.isEmpty()) {
                redisTemplate.opsForValue().set(queryKey, params);
            }
        }

        //拼接Query参数到url上
        HttpUrl.Builder urlBuilder = HttpUrl.parse(baseUrl).newBuilder();
        if (params != null) {
            params.forEach(p -> {
                if (p.getIsChecked()) {
                    urlBuilder.addQueryParameter(p.getName(), p.getValue());
                }
            });
        }
        String url = urlBuilder.toString();

        //获取Body参数
        String contentType = requestDTO.getContentType();
        String bodyKey = "params_" + paramsApiId + "_" + contentType;
        List<Params> bodyParams = (List<Params>) redisTemplate.opsForValue().get(bodyKey);
        if (bodyParams == null || bodyParams.isEmpty()) {
            bodyParams = requestParamsMapper.getParams(paramsApiId, contentType);
            if ((bodyParams == null || bodyParams.isEmpty()) && fallbackApiId != null) {
                bodyParams = requestParamsMapper.getParams(fallbackApiId, contentType);
            }
            if (bodyParams != null && !bodyParams.isEmpty()) {
                redisTemplate.opsForValue().set(bodyKey, bodyParams);
            }
        }

        RequestBody requestBody = null;
        if (contentType.equals(Request.FormData)) {
            try {
                MultipartBody.Builder builder = new MultipartBody.Builder();
                if (bodyParams != null && !bodyParams.isEmpty()) {
                    bodyParams.forEach(p -> {
                        if (p.getIsChecked()) {
                            builder.addFormDataPart(p.getName(), p.getValue());
                        }
                    });
                    requestBody = builder.build();
                }
            } catch (Exception e) {
                throw new RequestException(MessageConstant.REQUEST_FAILED);
            }
        } else if (contentType.equals(Request.Json)) {
            if (bodyParams != null && !bodyParams.isEmpty()) {
                String jsonStr = bodyParams.get(0).getValue();
                requestBody = RequestBody.create(jsonStr, MediaType.parse("application/json"));
            }
        } else if (contentType.equals(Request.Urlencoded)) {
            FormBody.Builder builder = new FormBody.Builder();
            if (bodyParams != null) {
                bodyParams.forEach(p -> {
                    if (p.getIsChecked() != null && p.getIsChecked()) {
                        builder.add(p.getName(), p.getValue());
                    }
                });
            }
            requestBody = builder.build();
        }

        //获取Headers参数
        String headerKey = "params_" + paramsApiId + "_" + Request.Header;
        List<Params> headerParams = (List<Params>) redisTemplate.opsForValue().get(headerKey);
        if (headerParams == null || headerParams.isEmpty()) {
            headerParams = requestParamsMapper.getParams(paramsApiId, Request.Header);
            if ((headerParams == null || headerParams.isEmpty()) && fallbackApiId != null) {
                headerParams = requestParamsMapper.getParams(fallbackApiId, Request.Header);
            }
            if (headerParams != null && !headerParams.isEmpty()) {
                redisTemplate.opsForValue().set(headerKey, headerParams);
            }
        }

        Map<String, String> mp = headerParams != null ? headerParams.stream()
                .filter(param -> param.getIsChecked())
                .collect(Collectors.toMap(
                        Params::getName,
                        Params::getValue,
                        (oldV, newV) -> newV
                )) : Map.of();
        Headers headers = Headers.of(mp);

        //发送请求
        String method = api.getRequestMethod();
        Response response = null;
        try {
            if (method.equals(Request.GET)) {
                response = HttpClientUtil.doGET(url, headers);
            } else if (method.equals(Request.POST)) {
                response = HttpClientUtil.doPOST(url, requestBody, headers);
            } else if (method.equals(Request.PUT)) {
                response = HttpClientUtil.doPUT(url, requestBody, headers);
            } else if (method.equals(Request.DELETE)) {
                response = HttpClientUtil.doDELETE(url, headers);
            }

            if (response == null) {
                throw new RequestException(MessageConstant.REQUEST_FAILED);
            }

            if (!response.isSuccessful()) {
                return RequestVO.builder()
                        .body(response.body().string())
                        .code(String.valueOf(response.code()))
                        .build();
            }

            String body = null;
            if (response.body() != null) {
                try (ResponseBody responseBody = response.body()) {
                    body = responseBody.string();
                } catch (IOException e) {
                    throw new RequestException(MessageConstant.REQUEST_FAILED);
                }
            }
            return RequestVO.builder()
                    .body(body)
                    .code(String.valueOf(response.code()))
                    .build();
        } catch (IOException e) {
            throw new RequestException(MessageConstant.REQUEST_FAILED);
        } finally {
            if (response != null) {
                response.close();
            }
        }
    }

    @Override
    @Transactional
    public void delete(Long id) {
        // 软删除：标记草稿为已删除（保留参数和响应，发布时删除主表）
        Api draft = apiMapper.getById(id);
        if (draft != null && Boolean.TRUE.equals(draft.getIsDraft())) {
            draft.setMarkDeleted(true);
            apiMapper.updateApi(draft);
        }
    }

    @Override
    public List<ExportBatchVO>exportBatch(List<ExportBatchDTO> list) {
        //批量鉴权
        List<Long> apiIds = list.stream().map(ExportBatchDTO::getApiId).distinct().toList();
        List<Long> accessible = apiMapper.filterAccessibleApiIds(apiIds, BaseContext.getCurrentId());
        if (accessible.size() < apiIds.size()) {
            throw new NoPermissionException(MessageConstant.PERMISSION_DENIED);
        }

        List<ExportBatchVO> exportBatchVOs = new ArrayList<>();
        for (ExportBatchDTO dto : list) {
            Long apiId = dto.getApiId();

            //导出主表：如果传入的是草稿ID，解析为主表ID
            if (!Boolean.TRUE.equals(dto.getUseDraft())) {
                Api api = apiMapper.getById(apiId);
                if (api != null && Boolean.TRUE.equals(api.getIsDraft()) && api.getBaseId() != null) {
                    apiId = api.getBaseId();
                }
            }

            String contentType = dto.getFormatType();
            List<ExportParamVO> queryParams = requestParamsMapper.getExportParams(apiId, Request.Query);
            List<ExportParamVO> bodyParams = requestParamsMapper.getExportParams(apiId, contentType);
            List<ExportParamVO> headerParams = requestParamsMapper.getExportParams(apiId, Request.Header);

            ExportParamsVO exportParamsVO = ExportParamsVO.builder()
                    .query(queryParams)
                    .body(bodyParams)
                    .headers(headerParams)
                    .build();

            ExportResponseVO exportResponseVO = new ExportResponseVO();
            ResponseVO responseVO = responseMapper.getByApiId(apiId);
            if (responseVO != null) {
                BeanUtils.copyProperties(responseVO, exportResponseVO);
            }

            ExportBatchVO exportBatchVO = ExportBatchVO.builder()
                    .apiId(apiId)
                    .params(exportParamsVO)
                    .response(exportResponseVO)
                    .build();
            exportBatchVOs.add(exportBatchVO);
        }
        return exportBatchVOs;
    }

    @Override
    public void setBodyType(Long apiId, String bodyType) {
        Api api = apiMapper.getById(apiId);
        if (api == null || !Boolean.TRUE.equals(api.getIsDraft())) {
            throw new RequestException("只能设置草稿的 body 格式");
        }
        api.setBodyType(bodyType);
        apiMapper.updateApi(api);
    }

    /**
     * 清除Redis缓存
     */
    private void clearCache(String pattern) {
        try {
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception ignored) {
        }
    }
}
