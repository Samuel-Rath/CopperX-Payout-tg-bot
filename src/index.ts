// src/index.ts
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { setupAuth } from './commands/auth';

console.log('index.ts loaded');

dotenv.config();

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is missing in the .env file');
}

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log('Bot instance created');

// Debug logging
bot.use((ctx, next) => {
  console.log('Received update:', JSON.stringify(ctx.update));
  return next();
});

// Register authentication commands
setupAuth(bot);

// Replace bot.start(...) with:
bot.command('start', (ctx) => {
  console.log('Received /start command from:', ctx.from?.username);
  ctx.reply('Welcome to the Copperx Bot! Use /login to get started.');
});

// Launch the bot
console.log('Launching bot...');
bot.launch()
  .then(() => console.log('Bot is up and running...'))
  .catch(err => console.error('Bot launch error:', err));

// Just for demonstration
setTimeout(() => {
  console.log('After 10 seconds, the bot is still running.');
}, 10000);

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
