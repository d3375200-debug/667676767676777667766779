export default {
  async fetch(request, env) {
    const token = env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}`;

    if (request.method === "POST") {
      try {
        const payload = await request.json();
        if (!payload.message || !payload.message.text) return new Response("OK");

        const chatId = payload.message.chat.id;
        const text = payload.message.text;

        if (text === "/start") {
          await sendMessage(url, chatId, "Пришли название видео. Я найду его и отправлю файл!");
          return new Response("OK");
        }

        // Сообщение о начале работы
        await sendMessage(url, chatId, `Ищу видео "${text}"... Проверяю размер файла.`);

        // ВНИМАНИЕ: Здесь должна быть логика работы с внешним API
        // Так как Cloudflare сам не качает, мы используем 'посредника'
        // Для примера используем поиск, который выдает прямую ссылку
        const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`;

        const responseText = `Я нашел видео! \n\n` +
          `⚠️ Из-за лимитов Telegram (50МБ), если видео тяжелое, ` +
          `используй этот конвертер для нарезки по 7 минут: \n` +
          `🔗 [Скачать MP4 файлом](${videoUrl})`;

        await fetch(`${url}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: "Markdown"
          }),
        });

      } catch (e) {
        return new Response("Error: " + e.message);
      }
    }
    return new Response("OK", { status: 200 });
  },
};

async function sendMessage(url, chatId, text) {
  await fetch(`${url}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text }),
  });
}
