export default {
  async fetch(request, env) {
    const token = env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}`;

    if (request.method === "POST") {
      const payload = await request.json();

      if (payload.message && payload.message.text === "/start") {
        const chatId = payload.message.chat.id;
        const text = "Привет! Я запущен на Cloudflare через JavaScript и теперь всё работает!";
        
        await fetch(`${url}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: text }),
        });
      }
    }
    return new Response("OK", { status: 200 });
  },
};
