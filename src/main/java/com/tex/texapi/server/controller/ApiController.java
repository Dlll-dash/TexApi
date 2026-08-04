package com.tex.texapi.server.controller;

import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.enumeration.CheckType;
import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.*;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.pojo.vo.AddApiVO;
import com.tex.texapi.pojo.vo.ExportBatchVO;
import com.tex.texapi.pojo.vo.RequestVO;
import com.tex.texapi.server.annotation.TeamAuth;
import com.tex.texapi.server.service.ApiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/tex/api")
@Slf4j
//接口相关接口
public class ApiController {

    @Autowired
    private ApiService apiService;
    @Autowired
    private RedisTemplate redisTemplate;
    /**
     * 获取当前用户的草稿列表（自动补齐）
     * @param projectId
     * @return
     */
    @GetMapping("/list/{projectId}")
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.PROJECT)
    public Result<List> list(@PathVariable Long projectId){
        log.info("获取草稿列表：{}",projectId);
        List<Api> list = apiService.listDrafts(projectId);
        return Result.success(list);
    }

    /**
     * 查看主表API（只读参考）
     * @param id
     * @return
     */
    @GetMapping("/master/{id}")
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.API)
    public Result<Api> getMaster(@PathVariable Long id){
        log.info("查看主表API：{}",id);
        Api master = apiService.getMaster(id);
        return Result.success(master);
    }

    /**
     * 发布草稿（覆盖主表）
     * @param draftId
     * @param expectedMasterUpdateTime
     * @return
     */
    @PostMapping("/{draftId}/publish")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.API)
    public Result publish(@PathVariable Long draftId, @RequestParam(required = false) String expectedMasterUpdateTime){
        log.info("发布草稿：draftId={}", draftId);
        apiService.publish(draftId, expectedMasterUpdateTime);
        return Result.success();
    }

    /**
     * 放弃草稿
     * @param draftId
     * @return
     */
    @DeleteMapping("/{draftId}/draft")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.API)
    public Result discardDraft(@PathVariable Long draftId){
        log.info("放弃草稿：{}", draftId);
        apiService.discardDraft(draftId);
        return Result.success();
    }

    @PutMapping("/update")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.API)
    public Result updateApi(@RequestBody UpdateApiDTO updateApiDTO){
        log.info("更新接口：{}",updateApiDTO);
        apiService.updateApi(updateApiDTO);
        return Result.success();
    }

     @PostMapping("/add")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.PROJECT)
    public Result<AddApiVO> addApi(@RequestBody AddApiDTO apiDTO) {
         log.info("添加接口：{}", apiDTO);
         AddApiVO addApiVO=apiService.addApi(apiDTO);
         return Result.success(addApiVO);
     }

     @PostMapping("/send")
     @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.API)
     public Result<RequestVO> send(@RequestBody RequestDTO requestDTO){
         String key= BaseContext.getCurrentId()+"_"+requestDTO.getApiId();
         //设置随机过期时间，防止缓存雪崩
         long timeout=500+ new Random(System.currentTimeMillis()).nextInt(500);
         //防止短时间重复发
         if(redisTemplate.opsForValue().setIfAbsent(key,"1")){
             redisTemplate.expire(key,timeout, TimeUnit.MILLISECONDS);
         }else {
             return Result.error("请勿频繁发送请求");
         }

         log.info("发送请求：{}",requestDTO);
        RequestVO requestVO =apiService.send(requestDTO);
        return Result.success(requestVO);
     }

     @PutMapping("/updateInfo")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.API)
    public Result updateInfo(@RequestBody UpdateApiInfoDTO updateApiInfoDTO){
        log.info("更新接口信息：{}",updateApiInfoDTO);
        apiService.updateInfo(updateApiInfoDTO);
        return Result.success();
    }

    @DeleteMapping("/delete/{id}")
    @TeamAuth(level = TeamMember.ADMIN, checkType = CheckType.API)
    public Result delete(@PathVariable Long id) {
        log.info("删除接口：{}", id);
        apiService.delete(id);
        return Result.success();
    }

    @PostMapping("/export")
    public Result<List<ExportBatchVO>> exportBatch(@RequestBody List<ExportBatchDTO>list){
        log.info("批量导出接口：{}",list);
        List<ExportBatchVO> exportBatchVOs = apiService.exportBatch(list);
        return Result.success(exportBatchVOs);
    }

}
