const { Telegraf } = require('telegraf');
const { exec } = require('yt-dlp-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const bot = new Telegraf("8559664636:AAHAA1S2x-B4msBYxSZ1rU7B93csnmDy7Ls");

bot.on('text', async (ctx) => {
    const query = ctx.message.text;
    if (query === '/start') return ctx.reply('Пришли название видео!');

    ctx.reply(`Ищу и скачиваю: ${query}...`);

    try {
        // 1. Качаем видео
        await exec(query, {
            output: 'video.mp4',
            format: 'best[ext=mp4]',
            maxFilesize: '500M'
        });

        const stats = fs.statSync('video.mp4');
        const fileSizeInBytes = stats.size;
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

        if (fileSizeInMegabytes > 49) {
            ctx.reply('Файл большой, режу по 7 минут...');
            
            // 2. Режем через FFmpeg
            ffmpeg('video.mp4')
                .outputOptions(['-f segment', '-segment_time 420', '-c copy'])
                .output('part_%03d.mp4')
                .on('end', async () => {
                    const files = fs.readdirSync('.').filter(f => f.startsWith('part_'));
                    for (const file of files) {
                        await ctx.replyWithDocument({ source: file });
                        fs.unlinkSync(file);
                    }
                    fs.unlinkSync('video.mp4');
                })
                .run();
        } else {
            await ctx.replyWithDocument({ source: 'video.mp4' });
            fs.unlinkSync('video.mp4');
        }
    } catch (e) {
        ctx.reply('Ошибка: ' + e.message);
    }
});

bot.launch();
