package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.AddResponseDTO;
import com.tex.texapi.pojo.entity.Response;
import com.tex.texapi.pojo.vo.AddResponseVO;
import com.tex.texapi.pojo.vo.ResponseListVO;
import com.tex.texapi.pojo.vo.ResponseVO;
import com.tex.texapi.server.service.ResponseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tex/response")
@Slf4j
//响应相关接口
public class ResponseController {

    @Autowired
    private ResponseService responseService;

    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * 获取响应参数
     * @param id
     * @return
     */
    @GetMapping("/getResponse/{id}")
    public Result<ResponseVO> getResponse(@PathVariable Long id){
        log.info("获取响应参数：{}",id);
        String key="response_"+id;
        ResponseVO responseVO = (ResponseVO) redisTemplate.opsForValue().get(key);
        if(responseVO==null){
            responseVO = responseService.getResponse(id);
            redisTemplate.opsForValue().set(key,responseVO);
        }

        return Result.success(responseVO);
    }

    @PostMapping("/add")
    public Result<AddResponseVO> add(@RequestBody AddResponseDTO addResponseDTO){
        log.info("添加响应参数：{}",addResponseDTO);
        AddResponseVO addResponseVO = responseService.add(addResponseDTO);
        return Result.success(addResponseVO);
    }

    /**
     * 获取响应参数信息列表
     * @param apiId
     * @return
     */
    @GetMapping("/list/{apiId}")
    public Result<List> list(@PathVariable Long apiId) {
        log.info("获取响应参数列表：{}", apiId);
        String key="response_list_"+apiId;
        List<ResponseListVO> list = (List<ResponseListVO>) redisTemplate.opsForValue().get(key);
        if(list==null||list.size()==0){
            list = responseService.list(apiId);
            redisTemplate.opsForValue().set(key,list);
        }

        return Result.success(list);
    }

    @PutMapping("/updateBody")
    public Result updateBody(@RequestBody Response response){
        log.info("更新响应参数：{}",response);
        responseService.update(response);
        String key="response_"+response.getId();
        redisTemplate.opsForValue().set(key,response);
        return Result.success();
    }

    @PutMapping("/updateInfo")
    public Result updateInfo(@RequestBody Response response){
        log.info("更新响应参数信息：{}",response);
        responseService.updateInfo(response);
        String key="response_list_"+response.getApiId();
        redisTemplate.delete(key);
        return Result.success();
    }
}
