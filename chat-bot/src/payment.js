import {MAX_FREE_MESSAGES} from "./constants";

export const needToAskForPayment = async (request, db) => {
  try {
    const message = await extractUserMessage(request);

    if (message?.from?.id) {
      const userId = message.from.id;
      const userData = await db.get(userId);

      if (userData) {
        const {messageCounter} = JSON.parse(userData);

        return messageCounter > MAX_FREE_MESSAGES;
      }

      return false;
    }
  } catch (error) {
    console.log(error);
  }
};
