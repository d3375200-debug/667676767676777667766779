import os
import telebot
from yt_dlp import YoutubeDL
import subprocess

# Твой токен
TOKEN = "8559664636:AAHAA1S2x-B4msBYxSZ1rU7B93csnmDy7Ls"
bot = telebot.TeleBot(TOKEN)

@bot.message_handler(func=lambda message: True)
def handle_message(message):
    query = message.text
    bot.reply_to(message, f"Ищу видео: {query}... 🔎")

    # 1. Поиск и скачивание через yt-dlp
    ydl_opts = {
        'format': 'best[ext=mp4]',
        'outtmpl': 'video.mp4',
        'default_search': 'ytsearch1',
        'noplaylist': True,
    }

    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(query, download=True)
        filename = "video.mp4"
        duration = info['entries'][0]['duration'] if 'entries' in info else info['duration']

    # 2. Проверка: нужно ли резать (7 минут = 420 секунд)
    segment_time = 420 
    if duration > segment_time:
        bot.send_message(message.chat.id, "Видео длинное, режу по 7 минут... ✂️")
        
        # Нарезка через ffmpeg
        subprocess.run([
            'ffmpeg', '-i', filename, '-c', 'copy', '-map', '0', 
            '-segment_time', str(segment_time), '-f', 'segment', 'part_%03d.mp4'
        ])
        
        # Отправка частей
        for part in sorted(os.listdir('.')):
            if part.startswith('part_') and part.endswith('.mp4'):
                with open(part, 'rb') as f:
                    bot.send_video(message.chat.id, f)
                os.remove(part) # Удаляем часть после отправки
    else:
        # Отправка целиком
        with open(filename, 'rb') as f:
            bot.send_video(message.chat.id, f)

    os.remove(filename) # Удаляем оригинал

bot.polling()
