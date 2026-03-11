package com.tex.texapi.common.context;

public class BaseContext {

    public static ThreadLocal<Long> threadLocal=new ThreadLocal<>();

    public static void setCurrentId(Long id){threadLocal.set(id);}

    public static Long getCurrentId(Long id){return threadLocal.get();}

    public static void removeCurrentId(){threadLocal.remove();}


}
