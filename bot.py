import config
import logging
import bot_helpers

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
				await message.reply("this command must be an answer on some message")
				return

		await message.bot.delete_message(
			chat_id=config.GROUP_ID,
			message_id=message.message_id,
		)
		await message.bot.kick_chat_member(
			chat_id=message.chat.id,
			user_id=message.reply_to_message.from_user.id,
		)
		await message.reply_to_message.reply("user has been banned")

# unban user (admins only)
@dp.message_handler(is_admin=True, commands=["unban"], commands_prefix="!/")
async def user_unban(message: types.Message):
		await message.bot.unban_chat_member(
			chait_id=config.GROUP_ID,
			user_id=message,
			only_if_banned=True
		)
		await message.reply_to_message.reply("user has been unbanned")

# pin a message (admins only)
@dp.message_handler(is_admin=True, commands=["pin"], commands_prefix="!/")
async def pin_message(message: types.Message):
		real_message = bot_helpers.message_without_command('/pin', message.text)

		if not real_message:
				await message.reply("empty message")
				return

		await message.bot.pin_chat_message(
			config.GROUP_ID,
			message.message_id,
			True, # disable notification for members
		)
		await message.bot.send_message(message.chat.id, "message has been pinned")	

# unpin a last message (admins only)
@dp.message_handler(is_admin=True, commands=["unpin"], commands_prefix="!/")
async def unpin_message(message: types.Message):
		await message.bot.unpin_chat_message(message.chat.id)

# replace a default message when user joined
@dp.message_handler(content_types=["new_chat_members"])
async def on_user_joined(message: types.Message):
		await message.delete()
		await message.bot.send_message(
				config.GROUP_ID,
				f"hi *{message.chat.first_name}* in our group",
				"MarkdownV2",
			)

# secret method (admins only)
@dp.message_handler(is_admin=True, commands=["secret"], commands_prefix="!/")
async def secret_method(message: types.Message):
		user_secret = bot_helpers.message_without_command('/secret', message.text)
		# don't show secret in the chat
		await message.delete()

		if user_secret != config.SECRET:
				fake_secret = "*" * len(user_secret)

				await message.bot.send_message(
					config.GROUP_ID,
					f"wrong secret: {fake_secret}",
				)
				return

		await message.bot.send_message(
				config.GROUP_ID,
				f"secret mode was been activated for {message.chat.first_name}",
			)

# delete messages with forbidden words
@dp.message_handler()
async def filter_messages(message: types.Message):
		if bot_helpers.has_forbidden_word(message.text):
				await message.delete()
				await message.bot.send_message(
						config.GROUP_ID,
						"message has been deleted, because contains bad forbidden words",
					)

# run long-polling
if __name__ == '__main__':
		executor.start_polling(dp, skip_updates=True)