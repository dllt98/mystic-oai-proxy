import http from "http";
import url from "url";
import { jsonParse, toBuffer, cleanWhitespaceInFinalPrompt } from "./utils.mjs";
import { messagesToPrompt } from "./message-to-prompt.mjs";
import { parseMessages } from "./parse-messages.mjs";

let config = {
  corsHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": 1 * 24 * 60 * 60,
  },
  host: process.env.HOST || "127.0.0.1",
  port: process.env.PORT || 3030,
};

const getModels = async (req, res) => {
  const result = {
    object: "list",
    data: ["XWIN-70b"].map((model) => ({
      id: model,
      object: model,
      created: 1686935002,
      owned_by: "cohere",
    })),
  };
  const buffer = toBuffer(result);

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": buffer.length,
    ...config.corsHeaders,
  });

  res.end(buffer, "utf-8");
};

const getChatCompletions = async (req, res) => {
  await jsonParse(req, res);

  const {
    messages,
    temperature,
    presence_penalty,
    frequency_penalty,
    max_tokens,
  } = req.body;
  console.log("OPENAI COMPLETIONS", req.body);

  const { updatedMessages, updatedConfig } = parseMessages({
    messages,
    config,
  });
  config = { ...config, ...updatedConfig };

  // Build sample prompt first lol
  const prompt = messagesToPrompt({
    user: config.user,
    assistant: config.assistant,
    messages: updatedMessages,
    config,
  });

  // prompt = limitMessagesInContext(prompt, max_tokens);
  const promptText = cleanWhitespaceInFinalPrompt(
    prompt.map((v) => v.content).join("")
  );
  console.log("Prompt", promptText);

  let data = {
    pipeline_id_or_pointer: "conanak99/harry-xwin-70b-awq:latest",
    async_run: false,
    input_data: [
      {
        type: "array",
        value: [promptText],
      },
      {
        type: "dictionary",
        value: {
          max_tokens: max_tokens || 700,
          presence_penalty: presence_penalty,
          frequency_penalty: frequency_penalty,
          temperature: temperature,
          stop: "\nUSER,\n###,\nASSISTANT",
          top_k: 50,
          top_p: 0.9,
          use_cache: true,
        },
      },
    ],
  };

  const response = await fetch("https://www.mystic.ai/v3/runs", {
    body: JSON.stringify(data),
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: req.headers.authorization, // This should include
    },
  });

  if (!response.ok) {
    let text = await response.text();
    if (response.status === 429) {
      text = "Not enough GPU in MysticAI. Try again later >.<.";
    }
    return handleError(req, res, new Error(text));
  }

  const result = await response.json();
  console.log(JSON.stringify(result, null));
  const openAIResult = {
    id: result.id,
    object: "chat.completion",
    created: result.created_at,
    model: "XWIN-lol",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: result.result.outputs[0].value,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };

  console.log({ openAIResult });
  const buffer = toBuffer(openAIResult);
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": buffer.length,
    ...config.corsHeaders,
  });
  res.end(buffer, "utf-8");
};

const notFound = (req, res) => {
  const buffer = toBuffer({
    notfound: true,
    text: "You aren't supposed to open this in a browser.",
  });
  res.writeHead(404, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": buffer.length,
    ...config.corsHeaders,
  });
  res.end(buffer, "utf-8");
};

const handleError = (req, res, error) => {
  try {
    console.error(error.stack);
    const buffer = toBuffer({ error: error.message });
    res.writeHead(501, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": buffer.length,
      ...config.corsHeaders,
    });
    res.end(buffer, "utf-8");
  } catch (ignore) {
    //
  }
};

const httpServer = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, config.corsHeaders);
    return res.end();
  }

  const path = url.parse(req.url, true).pathname;

  try {
    if (req.method === "GET" && path === "/v1/models") {
      await getModels(req, res);
    } else if (req.method === "POST" && path === "/v1/chat/completions") {
      await getChatCompletions(req, res);
    } else {
      await notFound(req, res);
    }
  } catch (error) {
    handleError(req, res, error);
  }
});

const startServer = () => {
  httpServer.listen(config.port, config.host, async (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    console.log(
      `Proxy OpenAI API URL at http://${config.host}:${config.port}/v1`
    );
  });
};

startServer();
