import telebot
import os
import subprocess
from yt_dlp import YoutubeDL

# Твой токен уже здесь
TOKEN = '8559664636:AAHAA1S2x-B4msBYxSZ1rU7B93csnmDy7Ls'
bot = telebot.TeleBot(TOKEN)

# Лимиты Telegram
MAX_FILE_SIZE = 49 * 1024 * 1024  # 49 MB
MAX_DURATION = 420  # 7 минут в секундах

def get_video_duration(file_path):
    """Узнаем длительность видео через ffprobe"""
    try:
        cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{file_path}\""
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return float(result.stdout.strip()) if result.stdout else 0
    except Exception:
        return 0

def split_video(file_path, part_duration):
    """Режем видео на куски по времени"""
    base_name = os.path.splitext(file_path)[0]
    ext = os.path.splitext(file_path)[1]
    output_pattern = f"{base_name}_part%03d{ext}"
    
    cmd = f"ffmpeg -i \"{file_path}\" -c copy -map 0 -segment_time {part_duration} -f segment -reset_timestamps 1 \"{output_pattern}\""
    subprocess.run(cmd, shell=True)
    
    return sorted([f for f in os.listdir('.') if f.startswith(f"{base_name}_part") and f.endswith(ext)])

@bot.message_handler(commands=['start'])
def start(message):
    welcome_text = (
        "👋 Привет! Я бот для скачивания видео.\n\n"
        "📥 Поддерживаемые платформы:\n"
        "• YouTube, TikTok, Instagram\n\n"
        "Напиши название или скинь ссылку.\n"
        "📌 Важно: видео > 7 мин или > 49 МБ будут порезаны на части!"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(func=lambda message: True)
def handle_download(message):
    text = message.text
    chat_id = message.chat.id
    status_msg = bot.send_message(chat_id, "⏳ Начинаю работу...")

    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': f'video_{chat_id}.%(ext)s',
        'noplaylist': True,
    }

    try:
        search_query = text if text.startswith('http') else f"ytsearch1:{text}"
        
        with YoutubeDL(ydl_opts) as ydl:
            bot.edit_message_text("📥 Скачиваю файл на сервер...", chat_id, status_msg.message_id)
            info = ydl.extract_info(search_query, download=True)
            filename = ydl.prepare_filename(info)

        duration = get_video_duration(filename)
        file_size = os.path.getsize(filename)

        if duration > MAX_DURATION or file_size > MAX_FILE_SIZE:
            bot.edit_message_text("🎬 Видео слишком большое. Нарезаю...", chat_id, status_msg.message_id)
            parts = split_video(filename, MAX_DURATION)
            
            for part in parts:
                with open(part, 'rb') as v:
                    bot.send_video(chat_id, v, caption=f"📦 Часть: {part}")
                os.remove(part)
        else:
            with open(filename, 'rb') as v:
                bot.send_video(chat_id, v, caption="✅ Готово!")

        if os.path.exists(filename): os.remove(filename)
        bot.delete_message(chat_id, status_msg.message_id)

    except Exception as e:
        bot.edit_message_text(f"❌ Ошибка: {str(e)}", chat_id, status_msg.message_id)
        if 'filename' in locals() and os.path.exists(filename): os.remove(filename)

bot.polling(none_stop=True)
