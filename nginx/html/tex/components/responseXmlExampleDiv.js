import { typeList, typeExampleValue } from "../config/TypeConfig.js";

export function createResponseXmlExampleDiv(response, rightDiv) {

    if (!rightDiv) return;

    /**
     * 将带 type/value 结构的响应树递归替换为示例值，返回普通对象
     */
    function formatXmlWithExampleValues(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;

        const result = {};
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            const val = obj[key];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                if (val.type === typeList.object) {
                    result[key] = formatXmlWithExampleValues(val.value || {});
                } else {
                    result[key] = typeExampleValue[val.type] !== undefined ? typeExampleValue[val.type] : null;
                }
            } else {
                result[key] = val;
            }
        }
        return result;
    }

    /**
     * 将普通对象递归构建为带缩进的 XML 字符串
     */
    function buildXmlFromObject(obj, indentLevel) {
        indentLevel = indentLevel || 0;
        const indent = '  '.repeat(indentLevel);
        const childIndent = '  '.repeat(indentLevel + 1);

        if (typeof obj !== 'object' || obj === null) {
            return indent + escXml(String(obj));
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return indent + escXml('[]');
            }
            return obj.map(function (item) {
                return buildXmlFromObject(item, indentLevel);
            }).join('\n');
        }

        const lines = [];
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            const val = obj[key];
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                lines.push(childIndent + '<' + key + '>');
                lines.push(buildXmlFromObject(val, indentLevel + 1));
                lines.push(childIndent + '</' + key + '>');
            } else if (Array.isArray(val)) {
                lines.push(childIndent + '<' + key + '>');
                if (val.length === 0) {
                    lines.push(childIndent + '  ' + escXml('[]'));
                } else {
                    val.forEach(function (item) {
                        lines.push(buildXmlFromObject(item, indentLevel + 1));
                    });
                }
                lines.push(childIndent + '</' + key + '>');
            } else {
                lines.push(childIndent + '<' + key + '>' + escXml(String(val)) + '</' + key + '>');
            }
        }

        return lines.join('\n');
    }

    function escXml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    /**
     * 对 XML 字符串进行语法高亮分词，返回包含着色 span 的 DocumentFragment
     */
    function buildHighlightedXml(xmlString) {
        const fragment = document.createDocumentFragment();

        // 匹配: XML声明 | 开始/结束标签名 | 标签关闭符 | 文本内容
        const tokenPattern = /(<\?xml[^?]*\?>)|(<\/?[a-zA-Z_][\w\-.]*)|(\/?>)|([^<]+)/g;
        let lastIndex = 0;
        let match;

        while ((match = tokenPattern.exec(xmlString)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(xmlString.slice(lastIndex, match.index)));
            }

            const decl = match[1];   // <?xml ...?>
            const tagName = match[2]; // <tag 或 </tag 或 <tag
            const tagEnd = match[3];  // > 或 />
            const text = match[4];    // 标签间的文本

            if (decl) {
                const span = document.createElement('span');
                span.textContent = decl;
                span.className = 'xml-decl';
                fragment.appendChild(span);
            } else if (tagName) {
                // 分解: 可能是 <tagName 或 </tagName
                if (tagName.startsWith('</')) {
                    // 结束标签 </tagName
                    const punct = document.createElement('span');
                    punct.textContent = '</';
                    punct.className = 'xml-punct';
                    fragment.appendChild(punct);

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = tagName.slice(2);
                    nameSpan.className = 'xml-tag';
                    fragment.appendChild(nameSpan);
                } else {
                    // 开始标签 <tagName
                    const punct = document.createElement('span');
                    punct.textContent = '<';
                    punct.className = 'xml-punct';
                    fragment.appendChild(punct);

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = tagName.slice(1);
                    nameSpan.className = 'xml-tag';
                    fragment.appendChild(nameSpan);
                }
            } else if (tagEnd) {
                const span = document.createElement('span');
                span.textContent = tagEnd;
                span.className = 'xml-punct';
                fragment.appendChild(span);
            } else if (text) {
                // 文本内容 — 需要判断是纯空白还是实际内容
                const trimmed = text.trim();
                if (trimmed.length > 0) {
                    const span = document.createElement('span');
                    span.textContent = text;
                    span.className = 'xml-text';
                    fragment.appendChild(span);
                } else {
                    fragment.appendChild(document.createTextNode(text));
                }
            }

            lastIndex = tokenPattern.lastIndex;
        }

        if (lastIndex < xmlString.length) {
            fragment.appendChild(document.createTextNode(xmlString.slice(lastIndex)));
        }

        return fragment;
    }

    // 主流程
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    const exampleObj = formatXmlWithExampleValues(parsed);

    const innerXml = buildXmlFromObject(exampleObj, 0);
    const fullXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n' + innerXml + '\n</root>';

    const pre = document.createElement('pre');
    pre.className = 'response-xml-pre';
    pre.appendChild(buildHighlightedXml(fullXml));
    rightDiv.appendChild(pre);
}
