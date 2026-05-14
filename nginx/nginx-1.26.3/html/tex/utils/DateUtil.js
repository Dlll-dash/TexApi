    //格式化日期显示为中文格式，支持多种输入格式
    function formatDateToChinese(value) {
        if (!value) {
            return '未设置';
        }
        if (Array.isArray(value)) {
            const [year, month, day] = value;
            if (year && month && day) {
                return `${year}年${month}月${day}日`;
            }
        }
        const text = String(value).trim();
        const parts = text.split(',').map(part => part.trim()).filter(Boolean);
        if (parts.length >= 3 && parts.every(part => /^\d+$/.test(part))) {
            const [year, month, day] = parts;
            return `${year}年${month}月${day}日`;
        }
        if (/\d+\s*天前$|\d+\s*小时前$|\d+\s*分钟前$|刚刚$/.test(text)) {
            return text;
        }
        const date = new Date(text);
        if (Number.isNaN(date.getTime())) {
            return text;
        }
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    //格式化日期显示为相对时间，支持多种输入格式
    function formatRelativeTime(value) {
        if (!value) {
            return '未设置';
        }
        if (Array.isArray(value)) {
            const [year, month, day] = value;
            if (year && month && day) {
                return `${year}年${month}月${day}日`;
            }
        }
        const text = String(value).trim();
        const parts = text.split(',').map(part => part.trim()).filter(Boolean);
        if (parts.length >= 3 && parts.every(part => /^\d+$/.test(part))) {
            const [year, month, day] = parts;
            return `${year}年${month}月${day}日`;
        }
        if (/\d+\s*天前$|\d+\s*小时前$|\d+\s*分钟前$|刚刚$/.test(text)) {
            return text;
        }
        const date = new Date(text);
        if (Number.isNaN(date.getTime())) {
            return text;
        }
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    export { formatDateToChinese, formatRelativeTime };