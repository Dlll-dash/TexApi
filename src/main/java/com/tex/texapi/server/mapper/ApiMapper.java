package com.tex.texapi.server.mapper;

import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.pojo.entity.Params;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ApiMapper {

    /**
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    @Select("select * from api where project_id=#{id} order by status desc")
    List<Api> list(Long id);

}
