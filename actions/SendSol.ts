import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import { message } from "telegraf/filters";
import Keyboard from "./Keyboard";
import { env } from "../env";

const connection = new Connection(env.CONNECTION_URL);

export function sendSol(bot: any, USERS: Record<string, Keypair>, PENDING_REQUESTS: Record<string, {
    type: "SEND_SOL" | "SEND_TOKEN" | "BUY_MEMECOIN" | "SEND_MEMCOIN", 
    amount?: number, 
    to?: string 
}>){
    bot.action('send_sol_menu', async (ctx: any) => {
        try {
            const userId = ctx.from?.id; 
            if(!userId) return; 

            if (!USERS[userId]) {
                return ctx.sendMessage("You don't have a wallet yet...");
            }

            ctx.answerCbQuery(); 
            ctx.sendMessage("Please share the address of the person you want to send sol to....");

            PENDING_REQUESTS[userId] = {
                type: "SEND_SOL"
            };

        } catch (error) {
            console.log(error);
            await ctx.answerCbQuery('❌ Failed to send sol');
            return ctx.reply('❌ An error occurred. Please try again.');

        }
    });

    bot.on(message("text"), async (ctx: any) => {
        const userId = ctx.from?.id;
        if (!userId) return; 

        const pending = PENDING_REQUESTS[userId];
        if (!pending || pending.type !== "SEND_SOL") return; 

        const text = ctx.message.text.trim();

        if (!pending.to) {
            try {
                new PublicKey(text);
                pending.to = text;

                await ctx.sendMessage("How much SOL do you want to send?", {
                    parse_mode: "Markdown",
                });
            } catch {
                await ctx.reply("Invalid Solana address. Try again.");
                delete PENDING_REQUESTS[userId];
                return;
            }
        }

        const amount = Number(ctx.message.text);
        if (!Number.isFinite(amount) || amount <= 0) {
            await ctx.reply("Please enter a valid SOL amount, this transaction has being canceled, please try again");
            delete PENDING_REQUESTS[userId];
            return;
        }

        if(!pending.to){
            delete PENDING_REQUESTS[userId];
            return; 
        }

        pending.amount = amount;

        const sender = USERS[userId];
        const receiver = new PublicKey(pending.to);

        if(!sender){
            delete PENDING_REQUESTS[userId];
            return; 
        } 

        const balance = await connection.getBalance(sender.publicKey);
        if (balance < amount * LAMPORTS_PER_SOL) {
            await ctx.reply("Insufficient balance.");
            delete PENDING_REQUESTS[userId];
            return;
        }

        try {
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: sender.publicKey,
                    toPubkey: receiver,
                    lamports: amount * LAMPORTS_PER_SOL,
                })
            );

            const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [sender]
            );

            await ctx.sendMessage(
                `*Transaction Successful*\n\n` +
                `Signature:\n\`${signature}\`\n\n` +
                `Sent *${amount} SOL*`,
                {
                    parse_mode: "Markdown",
                    ...Keyboard,
                }
            );

        } catch (error) {
            console.error(error);
            await ctx.reply("Transaction failed.");
        }

        delete PENDING_REQUESTS[userId];
    })

    return; 
}