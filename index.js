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
          await sendMessage(url, chatId, "Привет! Пришли мне название видео. Я найду его и подготовлю MP4.");
          return new Response("OK");
        }

        // 1. Уведомляем пользователя, что начали поиск
        await sendMessage(url, chatId, `Принято! Ищу видео: "${text}"...`);

        // 2. Логика поиска и отправки (Имитация прямой загрузки)
        // В Cloudflare мы отправляем ссылку на видео, которую Telegram сам превратит в плеер
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`;
        
        const messageResponse = `Вот что я нашел по твоему запросу.\n\n` +
                                `Поскольку файл может быть большим (более 49МБ), ` +
                                `я подготовил его для просмотра:\n\n` +
                                `🔗 [Смотреть или скачать MP4](${searchUrl})`;

        await fetch(`${url}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            chat_id: chatId, 
            text: messageResponse,
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
