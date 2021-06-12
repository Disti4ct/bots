def message_without_command(command, message):
		result = message[len(command): len(message)]

		return result.strip()