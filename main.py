import sys
import os

# Помогаем Cloudflare найти установленные библиотеки
site_packages = os.path.join(os.getcwd(), ".python_packages/lib/site-packages")
if site_packages not in sys.path:
    sys.path.append(site_packages)

import telebot
from telebot import types

# Твой токен подтягивается из настроек wrangler.toml
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
bot = telebot.TeleBot(TOKEN)

# Пример простого обработчика
@bot.message_handler(commands=['start'])
def start(message):
    bot.reply_to(message, "Привет! Я запущен на Cloudflare Workers!")

# Это обязательная функция для работы в облаке
def fetch(request):
    return bot.process_new_updates([telebot.types.Update.de_json(request.text())])

# Если ты используешь стандартный запуск, оставь это для проверки локально
if __name__ == "__main__":
    bot.polling(none_stop=True)
