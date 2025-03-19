// src/commands/auth.ts
import { Telegraf, Context } from 'telegraf';
import axios from 'axios';

// Define the login state interface
export interface LoginState {
  loginStep?: 'awaiting_email' | 'awaiting_otp';
  email?: string;
}

// In‑memory store for login states, keyed by Telegram user ID (as a string)
const loginStates: { [userId: string]: LoginState } = {};

// Function to request OTP from Copperx API
async function requestOTP(email: string): Promise<void> {
  const url = `${process.env.COPPERX_BASE_URL}/api/auth/email-otp/request`;
  await axios.post(url, { email });
}

// Function to verify OTP and return a session token
async function authenticateOTP(email: string, otp: string): Promise<string> {
  const url = `${process.env.COPPERX_BASE_URL}/api/auth/email-otp/authenticate`;
  const response = await axios.post(url, { email, otp });
  // Assume response.data.token contains the session token
  return response.data.token;
}

// Setup authentication commands on the bot
export function setupAuth(bot: Telegraf<Context>) {
  // /login command starts the login process
  bot.command('login', async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;
    // Set login state for the user
    loginStates[userId] = { loginStep: 'awaiting_email' };
    await ctx.reply('Please enter your Copperx email address:');
  });

  // Listen for text messages to capture email and OTP inputs
  // Note: Including the "next" parameter allows us to pass control on if not in a login flow.
  bot.on('text', async (ctx, next) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    // Retrieve the user's login state
    const state = loginStates[userId];
    if (!state || !state.loginStep) {
      // Not in a login flow: pass to the next middleware/handler
      return next();
    }

    if (state.loginStep === 'awaiting_email') {
      // Treat the text as the email address
      const email = ctx.message.text.trim();
      try {
        await requestOTP(email);
        // Update state: now waiting for OTP and store the email
        loginStates[userId] = { loginStep: 'awaiting_otp', email };
        await ctx.reply(`An OTP has been sent to ${email}. Please enter the OTP:`);
      } catch (error) {
        await ctx.reply('Error sending OTP. Please check your email and try again.');
        console.error('OTP request error:', error);
      }
    } else if (state.loginStep === 'awaiting_otp' && state.email) {
      // Treat the text as the OTP code
      const otp = ctx.message.text.trim();
      try {
        const token = await authenticateOTP(state.email, otp);
        // Here you can store the token securely (e.g. in a database) keyed by userId
        await ctx.reply('Authentication successful! You can now use the bot commands.');
        // Clear the login state
        delete loginStates[userId];
      } catch (error) {
        await ctx.reply('Authentication failed. Please try /login again.');
        console.error('OTP authentication error:', error);
        // Optionally clear the state on failure
        delete loginStates[userId];
      }
    }
  });
}
