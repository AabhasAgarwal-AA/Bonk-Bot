import { Keypair } from "@solana/web3.js";
import { Markup } from "telegraf";

export function viewAddress(bot: any, USERS: Record<string, Keypair>){
    bot.action('view_address', async (ctx: any) => {
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
    
            const userPublicKey = USERS[userId].publicKey.toBase58();
            await ctx.answerCbQuery('Getting public key...');
                ctx.sendMessage(`Your public key is ${userPublicKey} [View on Solscan](https://solscan.io/account/${userPublicKey}) `, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('🔐 Export Private Key', 'export_private_key')
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
            await ctx.answerCbQuery('❌ Failed to view the address');
            return ctx.reply('❌ An error occurred. Please try again.');
        }
    });
}