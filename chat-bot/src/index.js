import {countMessage} from "./db";
import {msgChatWithOpenAI} from "./openai";
import {sendMessage, setupBot} from "./telegram";

const extractUserMessage = async (request) => {
  try {
    const raw = await request.json();

    return raw?.message;
  } catch (error) {
    throw error;
  }
};

const requestToOpenAI = async ({openAiToken, text}) => {
  try {
    return await msgChatWithOpenAI(text, openAiToken);
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      message : error.message,
      stack : error.stack,
    }),
                        {status : 200});
  }
};

const handleRequest = async (params) => {
  const {request, botToken, db} = params;
  const {pathname} = new URL(request.url);

  try {
    if (pathname === `/telegram/${botToken}/webhook`) {
      const message = await extractUserMessage(request);

      await countMessage(message, db);

      // Check if we have a text parameter, so ChatGPT can process it
      // and if we have a chat id so we send it back to a right user
      if (message?.text && message?.chat?.id) {
        const response = await requestToOpenAI({
          ...params,
          text : message?.text,
        });

        if (response) {
          await sendMessage(response, botToken, message?.chat?.id);
        } else if (response instanceof Error) {
          await sendMessage("Cannot process your request", botToken,
                            message?.chat?.id);
        }
      }
    }

    return null;
  } catch (error) {
    console.error(error);

    return new Response(`
      <h2>Something went wrong</h2>
      <p>Error: ${JSON.stringify({
                          message : error.message,
                          stack : error.stack,
                        })}</p>
    `,
                        {
                          status : 500,
                          headers : {"Content-Type" : "text/html"},
                        });
  }
};

export default {
  async fetch(request, env) {
    const {TG_BOT_TOKEN, OPEN_AI_TOKEN, DATABASE} = env;

    await setupBot(request, TG_BOT_TOKEN);

    const response = await handleRequest({
      request,
      botToken : TG_BOT_TOKEN,
      openAiToken : OPEN_AI_TOKEN,
      db : DATABASE,
    });

    return response || new Response("yep", {status : 200});
  },
};
