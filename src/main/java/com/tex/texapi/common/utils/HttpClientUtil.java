package com.tex.texapi.common.utils;

import okhttp3.*;

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
    public static Response executeRequest(Request request) throws IOException {
        OkHttpClient client = getClient();
        return client.newCall(request).execute();
    }

    /**
     * GET请求
     *
     * @param url
     * @param headers
     */
    public static Response doGET(String url, Headers headers) throws IOException {
        Request.Builder builder = new Request.Builder().url(url).get();
        if (headers != null) {
            builder.headers(headers);
        }
        return executeRequest(builder.build());
    }

    /**
     * POST请求
     *
     * @param url
     * @param body
     * @param headers
     */
    public static Response doPOST(String url, RequestBody body, Headers headers) throws IOException {
        Request.Builder builder = new Request.Builder().url(url).post(body);
        if (headers != null) {
            builder.headers(headers);
        }
        return executeRequest(builder.build());
    }

    /**
     * PUT请求
     *
     * @param url
     * @param body
     * @param headers
     */
    public static Response doPUT(String url, RequestBody body, Headers headers) throws IOException {
        Request.Builder builder = new Request.Builder().url(url).put(body);
        if (headers != null) {
            builder.headers(headers);
        }
        return executeRequest(builder.build());
    }

    /**
     * DELETE请求
     *
     * @param url
     * @param headers
     */
    public static Response doDELETE(String url, Headers headers) throws IOException {
        Request.Builder builder = new Request.Builder().url(url).delete();
        if (headers != null) {
            builder.headers(headers);
        }
        return executeRequest(builder.build());
    }
}
