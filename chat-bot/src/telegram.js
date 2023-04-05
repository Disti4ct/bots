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

export const bindCommands = async (token, commands) => {
  return await fetch(`${TELEGRAM_API_DOMAIN}/bot${token}/setMyCommands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commands,
    }),
  }).then((res) => res.json());
};

export const bindTelegramWebHook = async (token, url) => {
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

const getCommands = async () => {
  return {
    start: {
      command: "/start",
      description: "Start this bot",
      // callback: () =>
      //   sendMessage("What do you want to discuss?", token, context),
    },
    help: {
      command: "/help",
      description:
        "Show a base description of this bot and guide how to use it",
      // callback: () =>
      //   sendMessage(
      //     "Press /start command and ask any questions",
      //     token,
      //     context
      //   ),
    },
  };
};

export const setupBot = async (request, botToken, context) => {
  const domain = new URL(request.url).host;
  const url = `https://${domain}/telegram/${botToken}/webhook`;
  const commands = getCommands(botToken, context);

  await bindTelegramWebHook(botToken, url);
  await bindCommands(botToken, Object.values(commands));
};
