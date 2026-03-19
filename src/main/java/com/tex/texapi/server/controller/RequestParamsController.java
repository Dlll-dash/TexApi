package com.tex.texapi.server.controller;

import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.BodyParamDTO;
import com.tex.texapi.pojo.dto.ParamDTO;
import com.tex.texapi.pojo.entity.BodyParam;
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
        log.info("添加Query参数：{}", paramDTO);
        Params param=requestParamsService.addParam(paramDTO);
        return Result.success(param);
    }

    @GetMapping("/param/list/{id}")
    public Result<List> getParams(@PathVariable Long id){
        log.info("获取Query参数列表:{}",id);
        List<Params>list=requestParamsService.getParams(id);
        return Result.success(list);
    }

    @PutMapping("/param/{id}")
    public Result updateParam(@RequestBody ParamDTO paramDTO,@PathVariable Long id){
        log.info("更新Query参数：{}, {}",id,paramDTO);
        requestParamsService.upadateParam(paramDTO,id);
        return Result.success();
    }

    @DeleteMapping("/param/delete/{id}")
    public Result deleteParam(@PathVariable Long id) {
        log.info("删除Query：{}", id);
        requestParamsService.deleteParam(id);
        return Result.success();
    }


    //Body参数相关

        //forData参数相关
    @PostMapping("/formData")
    public Result<BodyParam> addFormData(@RequestBody BodyParamDTO bodyParamDTO){
        log.info("添加FormData参数：{}", bodyParamDTO);
        BodyParam bodyParam=requestParamsService.addFormData(bodyParamDTO);
        return Result.success(bodyParam);
    }

    @GetMapping("/formData/list/{id}")
    public Result<List> getFormData(@PathVariable Long id){
        log.info("获取FormData参数列表:{}",id);
        List<BodyParam> list=requestParamsService.getFormData(id);
        return Result.success(list);
    }

    @PutMapping("/formData/{id}")
    public Result updateFormData(@RequestBody BodyParamDTO bodyParamDTO,@PathVariable Long id){
        log.info("更新FormData参数：{}, {}",id,bodyParamDTO);
        requestParamsService.upadateFormData(bodyParamDTO,id);
        return Result.success();
    }

    @DeleteMapping("/formData/delete/{id}")
    public Result deleteFormData(@PathVariable Long id) {
        log.info("删除FormData：{}", id);
        requestParamsService.deleteFormData(id);
        return Result.success();
    }
}
