# Moderator bot template

Telegram bot that will help to manage a group

# Use

Fill data in the **config.py**

```python
TOKEN = "" # bot's token
GROUP_ID = "" # ID for a group where the bot will manage
'''
who knows this secret can use a secret method
'''
SECRET = ""
'''
if message has some of this words
then the bot'll delete this message
'''
FORBIDDEN_WORDS = []
```

## Local

```bash
git clone https://github.com/NotEternal/moderatorBot.git

pip3 install -r requirements.txt

python3 bot.py
```
