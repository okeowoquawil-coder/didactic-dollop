
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const token = process.env.HF_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "AI service is not configured."
    });
  }

  const { prompt, tool } = req.body || {};

  const tools = {
    caption: "social media caption creator",
    brand: "professional brand assistant",
    product: "product description writer"
  };

  if (
    typeof prompt !== "string" ||
    !prompt.trim() ||
    prompt.length > 1200 ||
    !tools[tool]
  ) {
    return res.status(400).json({
      error: "Please enter a valid idea and choose a tool."
    });
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V4.1-Flash:fastest",
          messages: [
            {
              role: "system",
              content: "You are NEXORA AI, a creative assistant. Give original, useful and well-written answers suitable for a general audience."
            },
            {
              role: "user",
              content: `Act as a ${tools[tool]}. Create a result from this idea: ${prompt.trim()}`
            }
          ],
          max_tokens: 350,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Hugging Face error:", data);

      return res.status(502).json({
        error: "AI provider error. Please try again."
      });
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        error: "No AI response received."
      });
    }

    return res.status(200).json({
      result: answer
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong."
    });
  }
}
