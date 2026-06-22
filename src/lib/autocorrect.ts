const cjkRegex = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\u3100-\u312f\uac00-\ud7af]/;
const alphaNumRegex = /[a-zA-Z0-9]/;

const punctuationMap: Record<string, string> = {
  ',': '，',
  '.': '。',
  '!': '！',
  '?': '？',
  ':': '：',
  ';': '；',
  '(': '（',
  ')': '）',
  '[': '【',
  ']': '】'
};

function protectMarkdown(text: string) {
  const segments: string[] = [];
  const protectedText = text.replace(
    /!\[[^\]\n]*\](?:\([^\)\n]*\)|\[[^\]\n]*\])?|\[[^\]\n]*\](?:\([^\)\n]*\)|\[[^\]\n]*\])|`[^`\n]+`|```[\s\S]*?```/g,
    (match) => {
      const token = `\uE000MD${segments.length}\uE001`;
      segments.push(match);
      return token;
    }
  );
  return { protectedText, segments };
}

function restoreMarkdown(text: string, segments: string[]) {
  return text.replace(/\uE000MD(\d+)\uE001/g, (_, index) => segments[Number(index)] || '');
}

export function fixCjkSpacing(text: string) {
  if (!text) return text;
  const { protectedText, segments } = protectMarkdown(text);
  let result = '';
  let previous = '';

  for (let index = 0; index < protectedText.length; index += 1) {
    const char = protectedText[index];
    const next = protectedText[index + 1] || '';

    if (cjkRegex.test(char) && alphaNumRegex.test(next)) {
      result += `${char} `;
    } else if (alphaNumRegex.test(char) && cjkRegex.test(next)) {
      result += `${char} `;
    } else if (cjkRegex.test(previous) && punctuationMap[char] && !cjkRegex.test(next)) {
      result += punctuationMap[char];
    } else {
      result += char;
    }

    previous = char;
  }

  result = result.replace(/ {2,}/g, ' ').replace(/\n /g, '\n').replace(/ \n/g, '\n');
  return restoreMarkdown(result, segments);
}
