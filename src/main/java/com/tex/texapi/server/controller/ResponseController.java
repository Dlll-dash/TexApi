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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tex/response")
@Slf4j
//响应相关接口
public class ResponseController {

    @Autowired
    private ResponseService responseService;

    @GetMapping("/getResponse/{id}")
    public Result<ResponseVO> getResponse(@PathVariable Long id){
        log.info("获取响应参数：{}",id);
        ResponseVO responseVO = responseService.getResponse(id);
        return Result.success(responseVO);
    }

    @PostMapping("/add")
    public Result<AddResponseVO> add(@RequestBody AddResponseDTO addResponseDTO){
        log.info("添加响应参数：{}",addResponseDTO);
        AddResponseVO addResponseVO = responseService.add(addResponseDTO);
        return Result.success(addResponseVO);
    }

    @GetMapping("/list/{apiId}")
    public Result<List> list(@PathVariable Long apiId) {
        log.info("获取响应参数列表：{}", apiId);
        List<ResponseListVO> list = responseService.list(apiId);
        return Result.success(list);
    }

    @PutMapping("/update")
    public Result update(@RequestBody Response response){
        log.info("更新响应参数：{}",response);
        responseService.update(response);
        return Result.success();
    }
}
