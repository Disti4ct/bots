import {msgChatWithOpenAI} from "./openai";
import {sendMessage, setupBot} from "./telegram";

const getChatContext = (env) => {
  const {CHAT_ID} = env;

  return {
    chat_id : Number(CHAT_ID),
    reply_to_message_id : null,
    parse_mode : "HTML",
  };
};

const extractUserMessage = async (request) => {
  try {
    const raw = await request.json();

    return raw?.message?.text;
  } catch (error) {
    throw error;
  }
};

const requestToOpenAI = async ({request, openAiToken}) => {
  try {
    const message = await extractUserMessage(request);

    if (!message)
      return null;

    return await msgChatWithOpenAI(message, openAiToken);
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
  const {request, chatContext, botToken} = params;
  const {pathname} = new URL(request.url);

  try {
    if (pathname === `/telegram/${botToken}/webhook`) {
      const response = await requestToOpenAI(params);

      if (response) {
        await sendMessage(response, botToken, chatContext);
      } else if (response instanceof Error) {
        await sendMessage("Cannot process your request", botToken, chatContext);
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
    const {TG_BOT_TOKEN, OPEN_AI_TOKEN} = env;
    const chatContext = getChatContext(env);

    await setupBot(request, TG_BOT_TOKEN);

    const response = await handleRequest({
      request,
      chatContext,
      botToken : TG_BOT_TOKEN,
      openAiToken : OPEN_AI_TOKEN,
    });

    return response || new Response("yep", {status : 200});
  },
};
