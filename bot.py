import config
import logging
import bot_helpers

from aiogram import Bot, Dispatcher, executor, types
from filters import IsAdminFilter
from sqlite import SQLight

# log level
logging.basicConfig(level=logging.INFO)

# bot init
bot = Bot(token=config.TOKEN)
dp = Dispatcher(bot)
db = SQLight("db.db")

# activate filters
dp.filters_factory.bind(IsAdminFilter)

# replace a default message when user joined and add him in the DB
@dp.message_handler(content_types=["new_chat_members"])
async def on_user_joined(message: types.Message):
		first_name = message.from_user.first_name

		await message.bot.send_message(
				message.chat.id,
				f"👋😊 Welcome *{first_name}* to our group",
				"MarkdownV2",
			)
		if not db.user_exists(message.from_user.id):
				db.add_user(message.from_user.id, 0)

# remove an user from the DB
@dp.message_handler(content_types=["left_chat_member"])
async def on_user_left(message: types.Message):
		first_name = message.from_user.first_name

		db.delete_user(message.from_user.id)
		await message.bot.send_message(
				message.chat.id,
				f"🥺 Goodbuy *{first_name}*",
				"MarkdownV2",
			)

# ban command (admins only)
@dp.message_handler(is_admin=True, commands=["kick"], commands_prefix="!/")
async def user_ban(message: types.Message):
		if not message.reply_to_message:
				await message.reply("⚠️ This command must be the answer on some message")
				return

		await message.bot.delete_message(chat_id=message.chat.id, message_id=message.message_id)
		await message.bot.kick_chat_member(
			chat_id=message.chat.id,
			user_id=message.reply_to_message.from_user.id,
		)
		await message.reply_to_message.reply("😈 User is kicked")

# unban user (admins only)
@dp.message_handler(is_admin=True, commands=["reborn"], commands_prefix="!/")
async def user_unban(message: types.Message):
		await message.bot.unban_chat_member(
			chait_id=message.chat.id,
			user_id=message,
			only_if_banned=True
		)
		await message.reply_to_message.reply("😇 User is reborned")

# show user's karma
@dp.message_handler(is_admin=True, commands=["karma"], commands_prefix="!/")
async def show_user_karma(message: types.Message):
		user_karma = db.get_user_karma(message.from_user.id)

		await message.bot.send_message(
			message.chat.id,
			f"📜 Your karma: {str(user_karma)}"
		)

# pin a message (admins only)
@dp.message_handler(is_admin=True, commands=["pin"], commands_prefix="!/")
async def pin_message(message: types.Message):
		real_message = bot_helpers.message_without_command('/pin', message.text)

		if not real_message:
				await message.reply("⚠️ Empty message")
				return

		await message.bot.pin_chat_message(
			message.chat.id,
			message.message_id,
			True, # disable notification for members
		)
		await message.bot.send_message(message.chat.id, "👍 Message is pinned")	

# unpin a last message (admins only)
@dp.message_handler(is_admin=True, commands=["unpin"], commands_prefix="!/")
async def unpin_message(message: types.Message):
		await message.bot.unpin_chat_message(message.chat.id)

# secret method (admins only)
@dp.message_handler(is_admin=True, commands=["secret"], commands_prefix="!/")
async def secret_method(message: types.Message):
		user_secret = bot_helpers.message_without_command('/secret', message.text)
		# don't show secret in the chat
		await message.delete()

		if user_secret != config.SECRET:
				fake_secret = "*" * len(user_secret)

				await message.bot.send_message(
					message.chat.id,
					f"❌ Wrong secret: {fake_secret}",
				)
				return

		await message.bot.send_message(
			message.chat.id,
			f"✨ Secret mode is activated for {message.chat.first_name}",
		)

# delete messages with forbidden words and decrease user's karma
@dp.message_handler()
async def filter_messages(message: types.Message):
		if bot_helpers.has_forbidden_word(message.text):
				first_name = message.from_user.first_name

				db.decrease_user_karma(message.from_user.id)

				await message.delete()
				await message.bot.send_message(
					message.chat.id,
					f"👎 Inappropriate language\. Karma for *{first_name}* lowered",
					"MarkdownV2",
				)

# run long-polling
if __name__ == '__main__':
		executor.start_polling(dp, skip_updates=True)