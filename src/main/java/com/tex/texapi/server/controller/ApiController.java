package com.tex.texapi.server.controller;

import com.tex.texapi.common.context.BaseContext;
import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.AddApiDTO;
import com.tex.texapi.pojo.dto.RequestDTO;
import com.tex.texapi.pojo.dto.UpdateApiDTO;
import com.tex.texapi.pojo.dto.UpdateApiInfoDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.vo.AddApiVO;
import com.tex.texapi.pojo.vo.RequestVO;
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
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    @GetMapping("/list/{id}")
    public Result<List> list(@PathVariable Long id){
        log.info("获取接口列表：{}",id);
        List<Api> list = apiService.list(id);
        return Result.success(list);
    }

    @PutMapping("/update")
    public Result updateApi(@RequestBody UpdateApiDTO updateApiDTO){
        log.info("更新接口：{}",updateApiDTO);
        apiService.updateApi(updateApiDTO);
        return Result.success();
    }

     @PostMapping("/add")
    public Result<AddApiVO> addApi(@RequestBody AddApiDTO apiDTO) {
         log.info("添加接口：{}", apiDTO);
         AddApiVO addApiVO=apiService.addApi(apiDTO);
         return Result.success(addApiVO);
     }

     @PostMapping("/send")
     public Result<RequestVO> send(@RequestBody RequestDTO requestDTO){
         String key= BaseContext.getCurrentId()+"_"+requestDTO.getApiId();
         //设置随机过期时间，防止缓存雪崩
         long timeout=500+ new Random(System.currentTimeMillis()).nextInt(500);
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
    public Result updateInfo(@RequestBody UpdateApiInfoDTO updateApiInfoDTO){
        log.info("更新接口信息：{}",updateApiInfoDTO);
        apiService.updateInfo(updateApiInfoDTO);
        return Result.success();
    }

    @DeleteMapping("/delete/{id}")
    public Result delete(@PathVariable Long id) {
        log.info("删除接口：{}", id);
        apiService.delete(id);
        return Result.success();
    }


}
