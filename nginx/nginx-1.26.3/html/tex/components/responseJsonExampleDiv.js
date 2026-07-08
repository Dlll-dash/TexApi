import { typeList,typeExampleValue } from "../config/TypeConfig.js";
export function createResponseJsonExampleDiv(response,rightDiv) {

    if (rightDiv) {
        // inject styles once
        // if (!document.getElementById('response-json-highlight-style')) {
        //     const style = document.createElement('style');
        //     style.id = 'response-json-highlight-style';
        //     const keyColor = '#569cd6';
        //     const valueColor = '#9cdcfe';
        //     style.textContent = `
            
        //     .json-punct { color: #d4d4d4; }
        //     .json-key { color: ${keyColor};  }
        //     .json-string { color: ${valueColor}; }
        //     .json-number, .json-boolean, .json-null { color: ${valueColor}; }
        //     `;
        //     document.head.appendChild(style);
        // }

        function buildHighlightedJson(prettyJson) {
            const fragment = document.createDocumentFragment();
            const tokenPattern = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)|\b(true|false|null)\b|([{}\[\],:])|(\s+)/g;
            let lastIndex = 0;
            let match;

            while ((match = tokenPattern.exec(prettyJson)) !== null) {
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(prettyJson.slice(lastIndex, match.index)));
                }

                const quotedText = match[1];
                const colonSuffix = match[2];
                const numberText = match[3];
                const literalText = match[4];
                const punctText = match[5];
                const whitespaceText = match[6];

                if (quotedText) {
                    const span = document.createElement('span');
                    span.textContent = quotedText;
                    span.className = colonSuffix ? 'json-key' : 'json-string';
                    fragment.appendChild(span);
                    if (colonSuffix) {
                        const punct = document.createElement('span');
                        punct.textContent = ': ';
                        punct.className = 'json-punct';
                        fragment.appendChild(punct);
                    }
                } else if (numberText) {
                    const span = document.createElement('span');
                    span.textContent = numberText;
                    span.className = 'json-number';
                    fragment.appendChild(span);
                } else if (literalText) {
                    const span = document.createElement('span');
                    span.textContent = literalText;
                    span.className = literalText === 'null' ? 'json-null' : 'json-boolean';
                    fragment.appendChild(span);
                } else if (punctText) {
                    const span = document.createElement('span');
                    span.textContent = punctText;
                    span.className = 'json-punct';
                    fragment.appendChild(span);
                } else if (whitespaceText) {
                    fragment.appendChild(document.createTextNode(whitespaceText));
                }

                lastIndex = tokenPattern.lastIndex;
            }

            if (lastIndex < prettyJson.length) {
                fragment.appendChild(document.createTextNode(prettyJson.slice(lastIndex)));
            }

            return fragment;
        }

        function formatJsonWithExampleValues(jsonString){
            let json= JSON.parse(jsonString);
            function replaceValues(obj) {
                if (typeof obj === 'object' && obj !== null) {
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)&&obj[key].type===typeList.object) {
                            if (typeof obj[key] === 'object' && obj[key] !== null) {
                                obj[key]=replaceValues(obj[key].value);
                            } 
                        }else {
                                obj[key]=typeExampleValue[obj[key].type]!==undefined?typeExampleValue[obj[key].type]:null;

                                //obj[key]=obj[key].type
                        }
                    }
                }
                return obj;
            }

            json=replaceValues(json);
            return JSON.stringify(json, null, 2);
        }
    

        const pretty = formatJsonWithExampleValues(typeof response === 'string' ? response : JSON.stringify(response));
        const pre = document.createElement('pre');
        pre.className = 'response-json-pre';
        pre.appendChild(buildHighlightedJson(pretty));
        rightDiv.appendChild(pre);
       
    }
}