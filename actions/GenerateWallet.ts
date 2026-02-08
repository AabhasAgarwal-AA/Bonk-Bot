import { Keypair } from "@solana/web3.js";
import { Markup } from "telegraf";

// We receive dependencies instead of importing globals
export function registerGenerateWallet(bot: any, USERS: Record<string, Keypair>) {
    bot.action('generate_wallet', async (ctx: any) => {
        try {
            await ctx.answerCbQuery('Generating new wallet...');

            const keypair = Keypair.generate();
            const userId = ctx.from?.id;

            if (!userId) return;

            USERS[userId] = keypair;

            await ctx.editMessageText("✅ *Wallet created*", {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('Import from Private Key', 'import_private_key'),
                    ],
                    [
                        Markup.button.callback('👁️ View Address', 'view_address'),
                        Markup.button.callback('🔐 Export Private Key', 'export_private_key'),
                    ],
                    [
                        Markup.button.callback('💰 Check Balance', 'check_balance'),
                        Markup.button.callback('📊 Transaction History', 'tx_history'),
                    ],
                    [
                        Markup.button.callback('💸 Send SOL', 'send_sol_menu'),
                        Markup.button.callback('🪙 Send Token', 'send_token_menu'),
                    ],
                    [
                        Markup.button.callback('🐸 Buy Memecoins', 'buy_memecoin_menu'), 
                        Markup.button.callback('➢ Send Memecoins', 'send_memecoin_menu')
                    ]
                ]),
            });

        } catch (error) {
            console.error(error);
            await ctx.answerCbQuery('❌ Failed to generate wallet');
            return ctx.reply('❌ An error occurred. Please try again.');
        }
    });
}
