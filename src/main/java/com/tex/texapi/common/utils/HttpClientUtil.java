package com.tex.texapi.common.utils;

import com.tex.texapi.common.constant.MessageConstant;
import com.tex.texapi.common.exception.HttpException;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;

import java.io.IOException;

public class HttpClientUtil {
    private static OkHttpClient client;

    //获取客户端实例
    public static OkHttpClient getClient() {
        if (client == null) {
            //加锁，防止多线程环境下创建多个实例
            synchronized (HttpClientUtil.class) {
                if (client == null) {
                    client = new OkHttpClient();
                }
            }
        }
        return client;
    }

    //同步执行函数
    public static Response executeRequest(Request request)throws IOException{

        OkHttpClient client=getClient();
        Response response=client.newCall(request).execute();
        if (response.isSuccessful()) {
            return response; // 返回响应体内容
        } else {
            return null; // 请求失败，返回null
        }
    }

    /**
     * GET请求
     * @param url
     */
    public static Response doGET(String url) throws IOException {
        Request request=new Request.Builder()
                .url(url)
                .get()
                .build();
        return executeRequest(request);

    }

    /**
     * POST请求
     * @param url
     * @param jsonBody
     */
    public static Response doPOST(String url, String jsonBody){
        RequestBody body=RequestBody.create(jsonBody,MediaType.parse("application/json"));
        Request request=new Request.Builder()
                .url(url)
                .post(body)
                .build();

        return doPOST(url, jsonBody);
    }

    /**
     * PUT请求
     * @param url
     * @param jsonBody
     */
    public static Response doPUT(String url, String jsonBody){
        RequestBody body=RequestBody.create(jsonBody,MediaType.parse("application/json"));
        Request request=new Request.Builder()
                .url(url)
                .put(body)
                .build();
        return doPUT(url, jsonBody);
    }

    /**
     * DELETE请求
     * @param url
     */
    public static Response doDELETE(String url){
        Request request=new Request.Builder()
                .url(url)
                .delete()
                .build();
        return doDELETE(url);
    }
}
