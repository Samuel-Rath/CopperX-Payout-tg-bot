"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./commands/auth");
// Load environment variables from .env file
dotenv_1.default.config();
if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN is missing in the .env file');
}
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
// Use Telegraf's session middleware to manage state (for multi-step commands)
bot.use((0, telegraf_1.session)());
// Register authentication commands
(0, auth_1.setupAuth)(bot);
// Placeholder: Additional commands (wallet, transfers, etc.) can be set up similarly
// e.g. import { setupWallet } from './commands/wallet';
// setupWallet(bot);
// Simple command to test bot is working
bot.start((ctx) => ctx.reply('Welcome to the Copperx Bot! Use /login to get started.'));
// Launch the bot
bot.launch().then(() => console.log('Bot is up and running...'));
// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
