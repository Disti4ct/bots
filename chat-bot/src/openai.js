import {OPENAI_API_DOMAIN} from "./constants";

const requestCompletionsFromChatGPT = async (message, apiToken) => {
  const body = {
    model : "gpt-3.5-turbo",
    messages : [
      /* here should be history of the previous messages */
      {
        role : "user",
        content : message,
      },
    ],
  };

  const resp = await fetch(`${OPENAI_API_DOMAIN}/v1/chat/completions`, {
                 method : "POST",
                 headers : {
                   "Content-Type" : "application/json",
                   Authorization : `Bearer ${apiToken}`,
                 },
                 body : JSON.stringify(body),
               }).then((res) => res.json());

  if (resp.error?.message) {
    throw new Error(`OpenAI API error\n> ${resp.error.message}\n Prameters: ${
        JSON.stringify(body)}`);
  }

  return resp.choices[0].message.content;
};

export const msgChatWithOpenAI = async (message, apiToken) => {
  try {
    return await requestCompletionsFromChatGPT(message, apiToken);
  } catch (error) {
    return error;
  }
};
