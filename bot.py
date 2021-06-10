import config
import logging

from aiogram import Bot, Dispatcher, executor, types
from filters import IsAdminFilter

# log level
logging.basicConfig(level=logging.INFO)

# bot init
bot = Bot(token=config.TOKEN)
dp = Dispatcher(bot)

# activate filters
dp.filters_factory.bind(IsAdminFilter)

# ban command (admins only)
@dp.message_handler(is_admin=True, commands=["ban"], commands_prefix="!/")
async def user_ban(message: types.Message):
		if not message.reply_to_message:
				await message.reply("This command must be an answer on some message")
				return

		await message.bot.delete_message(chat_id=config.GROUP_ID, message_id=message.message_id)
		await message.bot.kick_chat_member(chait_id=config.GROUP_ID, user_id=message.reply_to_message)
		await message.reply_to_message.reply("User was deleted from this group")

# remove new user joined messages
@dp.message_handler(content_types=["new_chat_members"])
async def on_user_joined(message: types.Message):
		await message.delete()

# delete messages with forbidden words
def has_forbidden_word(message: types.Message):
		for bad_word in config.FORBIDDEN_WORDS:
				if (bad_word in message.lower()):
						return True

		return False

@dp.message_handler()
async def filter_messages(message: types.Message):
		if has_forbidden_word(message.text):
				await message.delete()
				await message.bot.send_message(
					config.GROUP_ID,
					"Message was deleted, because it contains bad words",
				)

# run long-polling
if __name__ == '__main__':
		executor.start_polling(dp, skip_updates=True)