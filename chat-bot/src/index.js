import {
  countMessage,
  needToAskForPayment,
  validateActivationMessage,
} from "./db";
import { msgChatWithOpenAI } from "./openai";
import { sendMessage, setupBot } from "./telegram";

const extractUserMessage = async (request) => {
  try {
    const raw = await request.json();

    return raw?.message;
  } catch (error) {
    throw error;
  }
};

const requestToOpenAI = async ({ openAiToken, text }) => {
  try {
    return await msgChatWithOpenAI(text, openAiToken);
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
  const {
    request,
    botToken,
    db,
    activationCode,
    amountOfFreeMessages,
    paymentLink,
  } = params;
  const { pathname } = new URL(request.url);

  try {
    if (pathname === `/telegram/${botToken}/webhook`) {
      const message = await extractUserMessage(request);

      // Check if we have a text parameter, so ChatGPT can process it
      // and if we have a chat id so we send it back to a right user
      if (message?.text && message?.chat?.id) {
        // First of all check the message format
        // If a user sent an activation code we validate it
        try {
          const validationResult = await validateActivationMessage({
            message,
            activationCode,
            botToken,
            db,
          });

          // If result isn't it means user sent activated code
          // So we won't need to send it to ChatGPT
          if (validationResult !== undefined) return;

          // Check if the user has reached the limit of free messages
          // Send a payment link and ask for an activation code
          const isPaymentRequired = await needToAskForPayment({
            userId: message.from.id,
            db,
            amountOfFreeMessages,
          });

          if (isPaymentRequired) {
            await sendMessage(
              `<b>You've reached the limit of free messages.</b>\nTo continue using this bot you need to pay for the activation code via the link below:\n<a href="${paymentLink}">Pay for usage</a>\nAfter payment, you need to send a message here with an activation code in the format:\n\n<i>This is the activation code:\naf9e4f3ef2080a003ef910dc2575497d</i>`,
              botToken,
              message.chat.id
            );
            return;
          }
        } catch (error) {
          await sendMessage(
            `error ${JSON.stringify({
              message: error.message,
              stack: error.stack,
            })}`,
            botToken,
            message?.chat?.id
          );
        }

        await countMessage(message, db);

        const response = await requestToOpenAI({
          ...params,
          text: message.text,
        });

        if (response) {
          await sendMessage(response, botToken, message.chat.id);
        } else if (response instanceof Error) {
          await sendMessage(
            "Cannot process your request",
            botToken,
            message?.chat?.id
          );
        }
      }
    }

    return null;
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
    const {
      TG_BOT_TOKEN,
      OPEN_AI_TOKEN,
      DATABASE,
      // Monetization variables
      ACTIVATION_CODE,
      AMOUNT_OF_FREE_MESSAGES,
      LINK_TO_PAY_FOR_CODE,
    } = env;

    await setupBot(request, TG_BOT_TOKEN);

    const response = await handleRequest({
      request,
      botToken: TG_BOT_TOKEN,
      openAiToken: OPEN_AI_TOKEN,
      db: DATABASE,
      activationCode: ACTIVATION_CODE,
      amountOfFreeMessages: AMOUNT_OF_FREE_MESSAGES,
      paymentLink: LINK_TO_PAY_FOR_CODE,
    });

    return response || new Response("yep", { status: 200 });
  },
};
