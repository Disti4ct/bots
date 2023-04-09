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
