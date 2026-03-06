package com.tex.texapi.common.result;

import lombok.Data;

import java.io.Serializable;

/**
 * 后端统一返回结果
 * @param <T>
 */
@Data
public class Result<T> implements Serializable {
    private Integer code;//状态码 0表示失败 1表示成功
    private String msg;//错误信息
    private T data;//返回的数据

    public static <T> Result<T> success(){
        Result result=new Result<T>();
        result.code= 1;
        return result;
    }

    public static <T> Result<T> success(T object){
        Result result=new Result<T>();
        result.code= 1;
        result.data=object;
        return result;
    }

    public static <T> Result<T> error(String msg){
        Result<T> result = new Result<T>();
        result.code= 0;
        result.msg=msg;
        return result;
    }
}
