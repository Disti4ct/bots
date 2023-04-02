import { sendMessage, setupBot } from "./telegram";
import { msgChatWithOpenAI } from "./openai";

const getChatContext = (env) => {
  const { CHAT_ID } = env;

  return {
    chat_id: Number(CHAT_ID),
    reply_to_message_id: null,
    parse_mode: "HTML",
  };
};

const loadMessage = async (request) => {
  try {
    const raw = await request.json();

    if (raw.message) {
      return raw.message;
    } else {
      throw new Error("Invalid message");
    }
  } catch (error) {
    throw error;
  }
};

const requestToOpenAI = async ({
  request,
  chatContext,
  botToken,
  openAiToken,
}) => {
  try {
    const message = await loadMessage(request);
    const response = await msgChatWithOpenAI(message, openAiToken);

    if (response) {
      sendMessage(response, botToken, chatContext);
    } else if (response instanceof Error) {
      sendMessage(`ERROR:CHAT: ${response.message}`, botToken, chatContext);
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: error.message,
        stack: error.stack,
      }),
      { status: 200 }
    );
  }
};

const handleRequest = async (params) => {
  try {
    const res = await requestToOpenAI(params);

    if (!res) return null;

    if (res?.ok) {
      return new Response("<h2>It works</h2>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("<h2>It does not work</h2>", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error(error);

    return new Response(
      `
      <h2>Something went wrong</h2>
      <p>Error: ${JSON.stringify({
        message: error.message,
        stack: error.stack,
      })}</p>
    `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
};

export default {
  async fetch(request, env) {
    const { TG_BOT_TOKEN, OPEN_AI_TOKEN } = env;
    const chatContext = getChatContext(env);

    await setupBot(request, TG_BOT_TOKEN, chatContext);

    return handleRequest({
      request,
      chatContext,
      botToken: TG_BOT_TOKEN,
      openAiToken: OPEN_AI_TOKEN,
    });
  },
};
