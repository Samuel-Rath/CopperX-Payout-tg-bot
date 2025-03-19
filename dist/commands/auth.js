"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = setupAuth;
const axios_1 = __importDefault(require("axios"));
// Function to request OTP from Copperx API
async function requestOTP(email) {
    const url = `${process.env.COPPERX_BASE_URL}/api/auth/email-otp/request`;
    await axios_1.default.post(url, { email });
}
// Function to verify OTP and return session token
async function authenticateOTP(email, otp) {
    const url = `${process.env.COPPERX_BASE_URL}/api/auth/email-otp/authenticate`;
    const response = await axios_1.default.post(url, { email, otp });
    // Assume response.data contains a token (in production, check the actual response structure)
    return response.data.token;
}
function setupAuth(bot) {
    // Trigger the login flow with /login command
    bot.command('login', async (ctx) => {
        ctx.reply('Please enter your Copperx email address:');
        // Set session flag for email input
        ctx.session = { loginStep: 'awaiting_email' };
    });
    // Listen to text messages to capture email and OTP inputs
    bot.on('text', async (ctx) => {
        var _a;
        // Only process messages if our session flag is set
        if (!((_a = ctx.session) === null || _a === void 0 ? void 0 : _a.loginStep))
            return;
        if (ctx.session.loginStep === 'awaiting_email') {
            // Capture the email from the user
            const email = ctx.message.text.trim();
            try {
                await requestOTP(email);
                ctx.reply(`An OTP has been sent to ${email}. Please enter the OTP:`);
                // Move to the OTP step
                ctx.session = { loginStep: 'awaiting_otp', email };
            }
            catch (error) {
                ctx.reply('Error sending OTP. Please check your email and try again.');
                console.error('OTP request error:', error);
            }
        }
        else if (ctx.session.loginStep === 'awaiting_otp' && ctx.session.email) {
            // Capture the OTP entered by the user
            const otp = ctx.message.text.trim();
            try {
                const token = await authenticateOTP(ctx.session.email, otp);
                // Here you would store the token securely (e.g. in a database associated with ctx.from.id)
                ctx.reply('Authentication successful! You can now use the bot commands.');
                // Clear the login session
                ctx.session = {};
            }
            catch (error) {
                ctx.reply('Authentication failed. Please try /login again.');
                console.error('OTP authentication error:', error);
            }
        }
    });
}
