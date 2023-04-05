import config


def get_status_by_karma(karma):
    result = ""

    if karma == 42:
        result = "✌️😎"
    elif karma >= 30 and karma <= 41:
        result = "💪😃"
    elif karma >= 12 and karma <= 29:
        result = "😏"
    elif karma >= 1 and karma <= 11:
        result = "🤓"
    elif karma == 0:
        result = "😐"
    elif karma >= -11 and karma <= -1:
        result = "😞"
    elif karma >= -29 and karma <= -12:
        result = "🤢"
    elif karma >= -41 and karma <= -30:
        result = "💩"
    elif karma == -42:
        result = "💀"

    return f"{result} {karma}"


def message_without_command(command, message):
    result = message[len(command):len(message)]

    return result.strip()


def has_forbidden_word(message):
    for bad_word in config.FORBIDDEN_WORDS:
        if bad_word in message.lower():
            return True

    return False
