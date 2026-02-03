import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Markup } from "telegraf";
import { env } from "../env";

const connection = new Connection(env.CONNECTION_URL);


export function checkBalance(bot: any, USERS: Record<string, Keypair>){
    bot.action('check_balance', async (ctx: any) => {
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
            await ctx.answerCbQuery('Getting your balance...');

            const userPublicKey = USERS[userId].publicKey;
            const balanceLamports = await connection.getBalance(userPublicKey);
            const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

            let balanceUSDC = 0; 
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                userPublicKey,
                { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
            );

            tokenAccounts.value.forEach(account => {
                const info = account.account.data.parsed.info;
                balanceUSDC = info.tokenAmount.uiAmount;
                console.log(
                    info.mint,
                    info.tokenAmount.uiAmount
                );
            });

            ctx.sendMessage(`Your balance is ${balanceSOL} sol and ${balanceUSDC} USDC`, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('👁️ View Address', 'view_address'),
                        Markup.button.callback('🔐 Export Private Key', 'export_private_key')
                    ],
                    [
                        Markup.button.callback('📊 Transaction History', 'tx_history')
                    ],
                    [
                        Markup.button.callback('💸 Send SOL', 'send_sol_menu'),
                        Markup.button.callback('🪙 Send Token', 'send_token_menu')
                    ]
                ])
            });
        } catch (error) {
            await ctx.answerCbQuery('❌ Failed to check the balance');
            return ctx.reply('❌ An error occurred. Please try again.');
        }
    });
}