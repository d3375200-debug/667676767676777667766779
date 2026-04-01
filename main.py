import sys
import os

# Автоматический поиск установленных библиотек
for path in [
    os.path.join(os.getcwd(), ".python_packages/lib/site-packages"),
    os.path.join(os.getcwd(), "vendor"),
    "/lib/python3.13/site-packages"
]:
    if os.path.exists(path) and path not in sys.path:
        sys.path.append(path)

try:
    import telebot
except ImportError:
    # Если всё равно не видит, выведем в лог список путей для отладки
    raise ImportError(f"Telebot не найден. Пути: {sys.path}")

from telebot import types

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start(message):
    bot.reply_to(message, "Бот наконец-то работает!")

def fetch(request):
    # Метод для обработки запросов от Cloudflare
    return bot.process_new_updates([types.Update.de_json(request.text())])
