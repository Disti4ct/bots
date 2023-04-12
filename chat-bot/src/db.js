export const countMessage = async (message, db) => {
  if (message?.from?.id) {
    const userId = message.from.id;
    const userData = await db.get(userId);

    if (userData) {
      const { messageCounter } = JSON.parse(userData);

      await db.put(
        userId,
        JSON.stringify({
          messageCounter: messageCounter + 1,
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
}) => {
  if (message.text.match(/This is the activation code: ?\n?[a-z0-9]{32}$/m)) {
    // Extract code sent
    const codeSent = message.text.match(/[a-z0-9]{32}/);

    // If code isn't right send a message about it
    if (codeSent !== activationCode) {
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
        ...userData,
        isItPaidFor: true,
      })
    );
  }
};
