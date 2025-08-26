import OpenAI from "openai";

const API_KEY = "";


const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: API_KEY
});

var date = new Date().toLocaleDateString();

const system_prompt_1 = `你现在是一位专业的内容审核员，你的任务是审核用户发布的内容，判断是否符合平台的规定。
    平台规定：
    1. 内容不能包含任何形式的违法、违规、不良、不良行为。
    2. 内容不能包含任何形式的个人隐私、个人信息、个人身份信息。
    3. 内容不能包含任何形式的广告、推广、销售、交易等。
    4. 内容不能包含任何形式的恶意攻击、恶意破坏、恶意篡改等。`

const system_prompt_2 = `
  你现在是一位语言学和心理学专家，你需要根据用户的发帖内容总结出恰当的标签,如果帖子内容过少，你需要恰当的联想
`

const text = "";

const prompt = `"用户发布的内容为：${text}"`

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [
        { role: "system", content: system_prompt_2 },
        {"role": "user", "content": prompt}
    ],
    model: "deepseek-chat",
    max_tokens: 1000
  });

  console.log(completion.choices[0].message);
}

main();
