function getRandomId(){
        //生成随机id
        return Date.now() + Math.random().toString(36).slice(2, 6);
    }


export {getRandomId};