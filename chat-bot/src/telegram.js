import { TELEGRAM_API_DOMAIN } from "./constants";

const send = async (message, token, context) => {
  return await fetch(`${TELEGRAM_API_DOMAIN}/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...context,
      text: message,
    }),
  });
};

export const sendMessage = async (message, botToken, chatContext) => {
  if (message.length <= 4096) {
    return await send(message, botToken, chatContext);
  }

  const limit = 4000;

  for (let i = 0; i < message.length; i += limit) {
    const msg = message.slice(i, i + limit);

    await send(`<pre>\n${msg}\n</pre>`, botToken, chatContext);
  }

  return new Response("MESSAGE BATCH SEND", { status: 200 });
};

const bindTelegramWebHook = async (token, url) => {
  return await fetch(`${TELEGRAM_API_DOMAIN}/bot${token}/setWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
    }),
  }).then((res) => res.json());
};

const checkIsWebhookSet = async (token) => {
  try {
    const response = await fetch(
      `${TELEGRAM_API_DOMAIN}/bot${token}/getWebhookInfo`
    ).then((res) => res.json());

    return !!response?.result?.url;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const setupBot = async (request, botToken) => {
  const domain = new URL(request.url).host;
  const url = `https://${domain}/telegram/${botToken}/webhook`;
  const isWebhookSet = await checkIsWebhookSet(botToken);

  if (!isWebhookSet) {
    await bindTelegramWebHook(botToken, url);
  }
};
