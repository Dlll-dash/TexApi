package com.tex.texapi.common.context;

public class BaseContext {

    public static ThreadLocal<Long> threadLocal=new ThreadLocal<>();
    public static ThreadLocal<Long> teamThreadLocal=new ThreadLocal<>();
    public static void setCurrentId(Long id){threadLocal.set(id);}

    public static Long getCurrentId(){return threadLocal.get();}

    public static void setCurrentTeamId(Long id){teamThreadLocal.set(id);}

    public static Long getCurrentTeamId(){return teamThreadLocal.get();}

    public static void removeCurrentId(){threadLocal.remove();}

    public static void removeCurrentTeamId(){teamThreadLocal.remove();}


}
