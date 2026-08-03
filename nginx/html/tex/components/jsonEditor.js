/**
 * JSON 编辑器组件
 * 增强 textarea：自动配对括号/引号、回车自动缩进、Tab 缩进、智能退格
 */

/**
 * 创建增强型 JSON 编辑器
 * @param {object} options
 * @param {string} [options.placeholder] - 占位文本
 * @param {string} [options.value] - 初始值
 * @param {Function} [options.onchange] - 内容变更回调
 * @returns {HTMLTextAreaElement}
 */
function createJsonEditor(options = {}) {
    const { placeholder = '', value = '', onchange = null } = options;
    const INDENT = '  '; // 2 空格缩进

    const textarea = document.createElement('textarea');
    textarea.className = 'json-input';
    textarea.placeholder = placeholder;
    textarea.value = value;
    textarea.spellcheck = false;

    //配对符号
    const PAIRS = { '{': '}', '[': ']', '"': '"' };
    const CLOSERS = { '}': '{', ']': '[' };

    textarea.addEventListener('keydown', function (e) {
        const ta = this;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const hasSelection = start !== end;
        const before = ta.value.substring(0, start);
        const after = ta.value.substring(end);

        // ==== Tab: 插入缩进 ====
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                // Shift+Tab: 减少缩进
                const lineStart = before.lastIndexOf('\n') + 1;
                const lineText = ta.value.substring(lineStart, start);
                const trimmed = lineText.replace(/^ {1,2}/, '');
                const removed = lineText.length - trimmed.length;
                ta.value = ta.value.substring(0, lineStart) + trimmed + after;
                ta.selectionStart = ta.selectionEnd = start - removed;
            } else if (hasSelection) {
                // 多行缩进
                const selText = ta.value.substring(start, end);
                const indented = selText.replace(/^/gm, INDENT);
                ta.value = before + indented + after;
                ta.selectionStart = start;
                ta.selectionEnd = start + indented.length;
            } else {
                // 插入缩进
                ta.value = before + INDENT + after;
                ta.selectionStart = ta.selectionEnd = start + INDENT.length;
            }
            if (onchange) onchange(ta.value);
            return;
        }

        // ==== Enter: 自动缩进 ====
        if (e.key === 'Enter') {
            e.preventDefault();
            const lineStart = before.lastIndexOf('\n') + 1;
            const currentLine = ta.value.substring(lineStart, start);
            // 当前行缩进（前导空格）
            const leading = currentLine.match(/^(\s*)/)[1];
            // 光标前最后一个非空字符
            const trimmed = currentLine.trimEnd();
            const lastChar = trimmed.charAt(trimmed.length - 1);
            // 如果以 { 或 [ 结尾，多加一级缩进
            const extra = (lastChar === '{' || lastChar === '[') ? INDENT : '';
            // 光标后紧跟的字符
            const nextChar = after.charAt(0);

            // 光标在空配对 {} 或 [] 中间 → 闭合符号推到独立行
            if ((lastChar === '{' || lastChar === '[') && nextChar === PAIRS[lastChar]) {
                const insert = '\n' + leading + extra + '\n' + leading;
                ta.value = before + insert + after;
                // 光标定位到缩进空行
                ta.selectionStart = ta.selectionEnd = start + 1 + leading.length + extra.length;
            } else {
                const insert = '\n' + leading + extra;
                ta.value = before + insert + after;
                ta.selectionStart = ta.selectionEnd = start + insert.length;

                // 闭合符号紧跟光标（同一行）→ 推到下一行并对齐缩进
                if (after.charAt(0) === '}' || after.charAt(0) === ']') {
                    const fixedAfter = leading + after.charAt(0) + after.substring(1);
                    ta.value = before + insert + fixedAfter;
                    ta.selectionStart = ta.selectionEnd = start + insert.length;
                }
            }

            if (onchange) onchange(ta.value);
            return;
        }

        // ==== Backspace: 智能删除配对 ====
        if (e.key === 'Backspace' && !hasSelection) {
            const pairBefore = before.charAt(before.length - 1);
            const pairAfter = after.charAt(0);
            if (PAIRS[pairBefore] === pairAfter) {
                e.preventDefault();
                ta.value = before.substring(0, before.length - 1) + after.substring(1);
                ta.selectionStart = ta.selectionEnd = start - 1;
                if (onchange) onchange(ta.value);
                return;
            }
        }

        // ==== 自动配对：{ [ " ====
        if (!hasSelection && PAIRS[e.key]) {
            // " 号特殊处理：前面不是字母/数字/空格或后面已有 " 就不配
            if (e.key === '"') {
                const prevChar = before.charAt(before.length - 1);
                const nextChar = after.charAt(0);
                // 光标在字符串内部时不配对
                if (nextChar === '"' || (prevChar !== ' ' && prevChar !== ':' && prevChar !== ',' && prevChar !== '{' && prevChar !== '[' && prevChar !== '\n' && prevChar !== '' && prevChar !== '\t')) {
                    return; // 不配对，正常输入
                }
            }
            e.preventDefault();
            const open = e.key;
            const close = PAIRS[open];
            ta.value = before + open + close + after;
            ta.selectionStart = ta.selectionEnd = start + 1;
            if (onchange) onchange(ta.value);
            return;
        }

        // ==== 自动跳过闭合符号 ====
        if (!hasSelection && CLOSERS[e.key] && after.charAt(0) === e.key) {
            e.preventDefault();
            ta.selectionStart = ta.selectionEnd = start + 1;
            return;
        }
    });

    return textarea;
}

export { createJsonEditor };
