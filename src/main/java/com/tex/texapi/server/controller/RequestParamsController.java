package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.ParamDTO;
import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.server.service.RequestParamsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tex/request")
@Slf4j
//请求所带参数相关接口
public class RequestParamsController {
    @Autowired
    private RequestParamsService requestParamsService;


    //Query参数相关
    @PostMapping("/param")
    public Result<Params> addParam(@RequestBody ParamDTO paramDTO){
        log.info("添加参数：{}", paramDTO);
        Params param=requestParamsService.addParam(paramDTO);
        return Result.success(param);
    }

    @GetMapping("/param/list/{id}")
    public Result<List> getParams(@PathVariable Long id,String formatType){
        log.info("获取参数列表:{}",id);
        List<Params>list=requestParamsService.getParams(id,formatType);
        return Result.success(list);
    }

    @PutMapping("/param/{id}")
    public Result updateParam(@RequestBody ParamDTO paramDTO,@PathVariable Long id){
        log.info("更新参数：{}, {}",id,paramDTO);
        requestParamsService.upadateParam(paramDTO,id);
        return Result.success();
    }

    @DeleteMapping("/param/delete/{id}")
    public Result deleteParam(@PathVariable Long id) {
        log.info("删除参数：{}", id);
        requestParamsService.deleteParam(id);
        return Result.success();
    }

}
