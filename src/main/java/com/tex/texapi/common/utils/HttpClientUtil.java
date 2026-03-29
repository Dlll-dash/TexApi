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
     * @param headers
     */
    public static Response doGET(String url,Headers headers) throws IOException {
        Request request=new Request.Builder()
                .url(url)
                .headers(headers)
                .get()
                .build();
        return executeRequest(request);

    }

    /**
     * POST请求
     * @param url
     * @param body
     * @param headers
     */
    public static Response doPOST(String url, RequestBody body,Headers headers) throws IOException {

        Request request=new Request.Builder()
                .url(url)
                .headers(headers)
                .post(body)
                .build();

        return executeRequest(request);
    }

    /**
     * PUT请求
     * @param url
     * @param body
     * @param headers
     */
    public static Response doPUT(String url, RequestBody body,Headers headers) throws IOException {
         Request request=new Request.Builder()
                .url(url)
                .headers(headers)
                .put(body)
                .build();
        return executeRequest(request);
    }

    /**
     * DELETE请求
     * @param url
     * @param headers
     */
    public static Response doDELETE(String url,Headers headers) throws IOException {
        Request request=new Request.Builder()
                .url(url)
                .headers(headers)
                .delete()
                .build();
        return executeRequest(request);
    }
}
