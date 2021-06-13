import config

def message_without_command(command, message):
		result = message[len(command): len(message)]

		return result.strip()

def has_forbidden_word(message):
		for bad_word in config.FORBIDDEN_WORDS:
				if (bad_word in message.lower()):
						return True

		return False