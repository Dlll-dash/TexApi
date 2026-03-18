package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.ParamDTO;
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
    public Result<Params> addParam(@RequestBody ParamDTO paramDTO){
        log.info("添加Query参数：{}", paramDTO);
        Params param=apiService.addParam(paramDTO);
        return Result.success(param);
    }

    @GetMapping("/param/list/{id}")
    public Result<List> getParams(@PathVariable Long id){
        log.info("获取Query参数列表:{}",id);
        List<Params>list=apiService.getParams(id);
        return Result.success(list);
    }

    @PutMapping("/param/{id}")
    public Result updateParam(@RequestBody ParamDTO paramDTO,@PathVariable Long id){
        log.info("更新Query参数：{}, {}",id,paramDTO);
        apiService.upadateParam(paramDTO,id);
        return Result.success();
    }

    @DeleteMapping("/param/delete/{id}")
    public Result deleteParam(@PathVariable Long id) {
        log.info("删除Query：{}", id);
        apiService.deleteParam(id);
        return Result.success();
    }
}
