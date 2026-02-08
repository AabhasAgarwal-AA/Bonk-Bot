import { Keypair } from "@solana/web3.js";
import { Markup } from "telegraf";
import bs58 from "bs58";

export function exportPrivateKey(bot: any, USERS: Record<string, Keypair>){
    bot.action('export_private_key', async (ctx: any) => {
        try {
            await ctx.answerCbQuery('Checking your wallet...');
            const userId = ctx.from?.id;
            if (!userId) return;

            if (!USERS[userId]) {
                return ctx.sendMessage('You don\'t have a wallet. Please generate one first.', {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔑 Generate Wallet', 'generate_wallet')]
                    ])
                });
            }
            await ctx.answerCbQuery('Getting public key...');
            const secretKey = bs58.encode(USERS[userId].secretKey);
            ctx.sendMessage(`Your private key is ${secretKey}`, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('👁️ View Address', 'view_address'),
                    ],
                    [
                        Markup.button.callback('💰 Check Balance', 'check_balance'),
                        Markup.button.callback('📊 Transaction History', 'tx_history')
                    ],
                    [
                        Markup.button.callback('💸 Send SOL', 'send_sol_menu'),
                        Markup.button.callback('🪙 Send Token', 'send_token_menu')
                    ], 
                    [
                        Markup.button.callback('🐸 Buy Memecoins', 'buy_memecoin_menu'), 
                        Markup.button.callback('➢ Send Memecoins', 'send_memecoin_menu')
                    ]
                ])
            });
        } catch (error) {
            await ctx.answerCbQuery('❌ Failed to get the private key');
            return ctx.reply('❌ An error occurred. Please try again.');
        }
    });
}