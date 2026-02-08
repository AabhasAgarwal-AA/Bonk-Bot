import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Markup } from "telegraf";
import { env } from "../env";

const connection = new Connection(env.CONNECTION_URL);

export function transactionHistory(bot: any, USERS: Record<string, Keypair>){
    bot.action('tx_history', async (ctx: any) => {
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
            await ctx.answerCbQuery('Getting your transaction hostory...');

            const userPublicKey = USERS[userId].publicKey;
            const signatures = await connection.getSignaturesForAddress(
                userPublicKey,
                { limit: 10 } // latest 10 txs
            );

            if (signatures.length === 0) {
                return ctx.sendMessage('No transactions found for your wallet.');
            }

            const transactions = await Promise.all(
                signatures.map(sig =>
                    connection.getParsedTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0,
                    })
                )
            );
            let message = `*Last 10 Transactions*\n\n`;
            transactions.forEach((tx, index) => {
                if (!tx || !tx.meta) return;

                const keys = tx.transaction.message.accountKeys;
                const pre = tx.meta.preBalances;
                const post = tx.meta.postBalances;

                let sender = '—';
                let receiver = '—';
                let amount = 0;

                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const preBal = pre[i];
                    const postBal = post[i];

                    if (!key || preBal === undefined || postBal === undefined) {
                        continue;
                    }

                    const diff = postBal - preBal;

                    if (diff < 0) {
                        sender = key.pubkey.toBase58();
                        amount = Math.abs(diff) / LAMPORTS_PER_SOL;
                    }

                    if (diff > 0) {
                        receiver = key.pubkey.toBase58();
                    }
                }

                const fee = tx.meta.fee / LAMPORTS_PER_SOL;

                const instructions = tx.transaction.message.instructions
                    .map(ix => {
                        if ("parsed" in ix) {
                            return `${ix.program}: ${ix.parsed.type}`;
                        }
                        return ix.programId.toBase58();
                    })
                    .join(', ');

                message +=
                    `*${index + 1}.*\n` +
                    ` *From:* \`${sender}\`\n` +
                    ` *To:* \`${receiver}\`\n` +
                    ` *Amount:* ${amount} SOL\n` +
                    ` *Fee:* ${fee} SOL\n` +
                    ` *Instruction:* ${instructions || 'N/A'}\n`
            });



            ctx.sendMessage(`Your transaction history for latest 10 transactions are ${message}`, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('👁️ View Address', 'view_address'),
                        Markup.button.callback('🔐 Export Private Key', 'export_private_key')
                    ],
                    [
                        Markup.button.callback('💰 Check Balance', 'check_balance')
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
            await ctx.answerCbQuery('❌ Failed to check the transaction history');
            return ctx.reply('❌ An error occurred. Please try again.');
        }
    });
}