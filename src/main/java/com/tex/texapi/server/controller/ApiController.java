package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.AddParamDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.server.service.ApiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tex/api")
@Slf4j
public class ApiController {

    @Autowired
    private ApiService apiService;

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

    @PostMapping("/param")
    public Result<Params> addParam(@RequestBody AddParamDTO addParamDTO){
        log.info("添加Query参数：{}",addParamDTO);
        Params param=apiService.addParam(addParamDTO);
        return Result.success(param);
    }

    @GetMapping("/getParams/{id}")
    public Result<List> getParams(@PathVariable Long id){
        log.info("获取Query参数列表:{}",id);
        List<Params>list=apiService.getParams(id);
        return Result.success(list);
    }
}
