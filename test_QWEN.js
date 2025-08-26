import OpenAI from "openai";

const API_KEY = 'sk-6ac2e65524124bcf8b34cc45089fada4';

const openai = new OpenAI(
    {
        apiKey: API_KEY,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    }
);

const prompt = `
你现在是一位语言学和心理学专家，你需要根据用户的发帖内容总结出恰当的标签。
如果帖子内容过少，你需要恰当的联想。
直接给出标签，以JSON形式返回
`;

const content = "今天是真热";

async function main() {
    const completion = await openai.chat.completions.create({
        // 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        model: "qwen-plus",  // qwen-plus 属于 qwen3 模型，如需开启思考模式，请参见：https://help.aliyun.com/zh/model-studio/deep-thinking
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: content }
        ],
    });
    console.log(completion.choices[0].message.content)
}

main()