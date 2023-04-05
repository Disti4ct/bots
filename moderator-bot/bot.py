import time
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
        config.GROUP_ID,
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
        config.GROUP_ID,
        f"🥺 Goodbuy *{first_name}*",
        "MarkdownV2",
    )


# ban command (admins only)


@dp.message_handler(is_admin=True, commands=["kick"], commands_prefix="!/")
async def user_ban(message: types.Message):
    if not message.reply_to_message:
        await message.reply("⚠️ This command must be the answer on some message")
        return

    await message.bot.delete_message(
        chat_id=config.GROUP_ID, message_id=message.message_id
    )
    await message.bot.kick_chat_member(
        chat_id=config.GROUP_ID,
        user_id=message.reply_to_message.from_user.id,
    )
    await message.reply_to_message.reply("😈 User is kicked")


# unban user (admins only)


@dp.message_handler(is_admin=True, commands=["reborn"], commands_prefix="!/")
async def user_unban(message: types.Message):
    await message.bot.unban_chat_member(
        chait_id=config.GROUP_ID, user_id=message, only_if_banned=True
    )
    await message.reply_to_message.reply("😇 User is reborned")


# show user's status


@dp.message_handler(is_admin=True, commands=["status"], commands_prefix="!/")
async def show_user_karma(message: types.Message):
    user_karma = db.get_user_karma(message.from_user.id)
    user_status = bot_helpers.get_status_by_karma(user_karma)

    await message.bot.send_message(
        config.GROUP_ID, f"📜 Your status: {str(user_status)}"
    )

    if int(user_karma) == -42:
        await send_kicking_poll(
            config.GROUP_ID,
            message.from_user.first_name,
            message.from_user.id,
        )


# send a poll about user kicking


async def send_kicking_poll(*args):
    [chat_id, user_name, user_id] = args

    delay = 10
    response = await bot.send_poll(
        chat_id=chat_id,
        question=f"Delete {user_name} from the group ❓",
        options=["😒 Yes, we don't need them", "😇 No, he's one of us"],
        is_anonymous=True,
        type="regular",
        open_period=delay,
    )

    time.sleep(delay - 1)

    poll_results = await bot.stop_poll(
        chat_id=chat_id,
        message_id=response.message_id,
    )

    [agree, disagree] = poll_results.options

    if agree.voter_count > disagree.voter_count:
        try:
            await bot.kick_chat_member(
                chat_id=config.GROUP_ID,
                user_id=user_id,
            )
            await bot.send_message("😈 User is kicked")
        except:
            await bot.send_message("The deletion failed. Isn't this the admin?")
    else:
        await bot.send_message("🤞 This time he was lucky")


# secret method (admins only)


@dp.message_handler(is_admin=True, commands=["secret"], commands_prefix="!/")
async def secret_method(message: types.Message):
    user_secret = bot_helpers.message_without_command("/secret", message.text)
    # don't show secret in the chat
    await message.delete()

    if user_secret != config.SECRET:
        fake_secret = "*" * len(user_secret)

        await message.bot.send_message(
            config.GROUP_ID,
            f"❌ Wrong secret: {fake_secret}",
        )
        return

    await message.bot.send_message(
        config.GROUP_ID,
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
            config.GROUP_ID,
            f"👎 Inappropriate language\. Karma for *{first_name}* lowered",
            "MarkdownV2",
        )


# run long-polling
if __name__ == "__main__":
    executor.start_polling(dp, skip_updates=True)
