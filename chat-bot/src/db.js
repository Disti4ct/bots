import { sendMessage } from "./telegram";

export const countMessage = async (message, db) => {
  if (message?.from?.id) {
    const userId = message.from.id;
    const userData = await db.get(userId);

    if (userData) {
      const parsedData = JSON.parse(userData);

      await db.put(
        userId,
        JSON.stringify({
          ...parsedData,
          messageCounter: parsedData.messageCounter + 1,
        })
      );
    } else {
      await db.put(
        userId,
        JSON.stringify({
          messageCounter: 1,
        })
      );
    }
  }
};

export const needToAskForPayment = async ({
  userId,
  db,
  amountOfFreeMessages,
}) => {
  const userData = await db.get(userId);

  if (userData) {
    const { messageCounter, isItPaidFor } = JSON.parse(userData);

    if (isItPaidFor) return false;
    if (messageCounter > amountOfFreeMessages) return true;
  }

  return false;
};

export const validateActivationMessage = async ({
  message,
  activationCode,
  botToken,
  db,
}) => {
  if (message.text.match(/This is the activation code: ?\n?[a-z0-9]{32}$/m)) {
    // Extract code sent
    const codeSent = message.text.match(/[a-z0-9]{32}/);

    // If code isn't right send a message about it
    if (String(codeSent) !== String(activationCode)) {
      await sendMessage("Your code is incorrect", botToken, message.chat.id);
      return false;
    }

    // If it's correct we save info about it
    // So he won't need to pay anymore
    const userId = message.from.id;
    const userData = await db.get(userId);

    await db.put(
      userId,
      JSON.stringify({
        ...JSON.parse(userData),
        isItPaidFor: true,
      })
    );
    await sendMessage("Successfully activated", botToken, message.chat.id);
    return true;
  }
};
