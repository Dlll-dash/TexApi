package com.tex.texapi.server.controller;

import com.tex.texapi.common.enumeration.CheckType;
import com.tex.texapi.common.result.Result;
import com.tex.texapi.pojo.dto.ParamDTO;
import com.tex.texapi.pojo.dto.UpdateParamDTO;
import com.tex.texapi.pojo.entity.Params;
import com.tex.texapi.pojo.entity.TeamMember;
import com.tex.texapi.server.annotation.TeamAuth;
import com.tex.texapi.server.service.RequestParamsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/tex/request")
@Slf4j
//请求所带参数相关接口
public class RequestParamsController {
    @Autowired
    private RequestParamsService requestParamsService;

    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * 添加参数
     * @param paramDTO
     * @return
     */
    @PostMapping("/param")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.API)
    public Result<Params> addParam(@RequestBody ParamDTO paramDTO){
        log.info("添加参数：{}", paramDTO);
        clearCache("params_"+paramDTO.getApiId()+"_"+paramDTO.getFormatType());
        Params param=requestParamsService.addParam(paramDTO);
        return Result.success(param);
    }

    /**
     * 获取参数列表
     * @param apiId 接口id
     * @param formatType
     * @return
     */
    @GetMapping("/param/list/{apiId}")
    @TeamAuth(level = TeamMember.VIEWER, checkType = CheckType.API)
    public Result<List> getParams(@PathVariable Long apiId,String formatType){
        log.info("获取参数列表:{}",apiId);

        String key="params_"+apiId+"_"+formatType;
        List<Params>list=(List<Params>) redisTemplate.opsForValue().get(key);

        if(list==null||list.size()==0){
            list=requestParamsService.getParams(apiId,formatType);
            redisTemplate.opsForValue().set(key,list);
        }

        return Result.success(list);
    }

    /**
     * 更新参数
     * @param updateParamDTO
     * @param id
     * @return
     */
    @PutMapping("/param/{id}")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.PARAM)
    public Result updateParam(@RequestBody UpdateParamDTO updateParamDTO, @PathVariable Long id){
        log.info("更新参数：{}, {}",id,updateParamDTO);
        requestParamsService.upadateParam(updateParamDTO,id);
        clearCache("params_"+updateParamDTO.getApiId()+"_"+updateParamDTO.getFormatType());
        return Result.success();
    }

    /**
     * 根据参数id删除参数
     * @param id
     * @return
     */
    @DeleteMapping("/param/delete/{id}")
    @TeamAuth(level = TeamMember.EDITOR, checkType = CheckType.PARAM)
    public Result deleteParam(@PathVariable Long id) {
        log.info("删除参数：{}", id);
        requestParamsService.deleteParam(id);
        //清空缓存
        clearCache("params_*");
        return Result.success();
    }

    private void clearCache(String pattern){
        //根据模式来清除缓存
        Set keys=redisTemplate.keys(pattern);
        redisTemplate.delete(keys);
    }
}
