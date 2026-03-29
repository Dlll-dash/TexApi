package com.tex.texapi;

import com.tex.texapi.common.utils.HttpClientUtil;
import okhttp3.Response;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;

@SpringBootTest
public class HttpClientTest {

    @Test
    public void testHttpClient() throws IOException {
        String url = "https://httpbin.org/get";
        Response response = HttpClientUtil.doGET(url,null);
        String res=response.body().string();

        System.out.println("Response: " + res);
    }
}
