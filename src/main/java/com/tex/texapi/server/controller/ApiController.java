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
//接口相关接口
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


}
