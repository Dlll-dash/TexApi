package com.tex.texapi.server.mapper;

import com.tex.texapi.common.constant.AutoFillConstant;
import com.tex.texapi.common.enumeration.OperationType;
import com.tex.texapi.pojo.dto.AddApiDTO;
import com.tex.texapi.pojo.dto.UpdateApiDTO;
import com.tex.texapi.pojo.dto.UpdateApiInfoDTO;
import com.tex.texapi.pojo.entity.Api;
import com.tex.texapi.server.annotation.AutoFill;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ApiMapper {

    /**
     * 添加接口
     *
     * @param apiDTO
     */
    @AutoFill(OperationType.INSERT)
    void addApi(AddApiDTO apiDTO);

    /**
     * 根据项目id获取接口列表
     * @param id
     * @return
     */
    //@Select("select * from api where project_id=#{id} order by status desc")
    List<Api> list(Long id);

    /**
     * 更新api信息
     * @param updateApiDTO
     */
    @AutoFill(OperationType.UPDATE)
    void updateApi(UpdateApiDTO updateApiDTO);

    /**
     * 根据id获取api
     * @param id
     * @return
     */
    @Select("select * from api where id=#{id}")
    Api getById(Long id);

    /**
     * 更新接口信息
     * @param updateApiInfoDTO
     */
    @AutoFill(OperationType.UPDATE)
    void updateInfo(UpdateApiInfoDTO updateApiInfoDTO);

    /**
     * 删除接口
     * @param id
     */
    @Delete("delete from api where id=#{id}")
    void deleteById(Long id);

    /**
     * 根据分类ids批量删除接口
     * @param categoryIds
     */
    void deleteBatchByCategoryId(List<Long> categoryIds);
}
