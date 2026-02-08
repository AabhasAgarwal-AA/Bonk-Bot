import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { message } from "telegraf/filters";
import { env } from "../env";
import Keyboard from "./Keyboard";

const connection = new Connection(env.CONNECTION_URL);


export function sendToken(bot: any, USERS: Record<string, Keypair>, PENDING_REQUESTS: Record<string, {
    type: "SEND_SOL" | "SEND_TOKEN" | "BUY_MEMECOIN" | "SEND_MEMCOIN", 
    amount?: number, 
    to?: string 
}>){
    bot.action('send_token_menu', async (ctx: any) => {
        try{
            const userId = ctx.from?.id; 
            if(!userId) return; 

            if(!USERS[userId]) {
                await ctx.sendMessage("You dont have a wallet yet...");
                return; 
            }

            ctx.answerCbQuery();
            ctx.sendMessage("Please share the address of the person you want to send sol to....");

            PENDING_REQUESTS[userId] = {
                type: "SEND_TOKEN"
            }

        } catch (error) {
            console.log(error); 
            await ctx.answerCbQuery('❌ Failed to send USDC');
            await ctx.reply('❌ An error occured, Please try again.');
            return;
        }
    });

    bot.on(message("text"), async (ctx: any) => {
        const userId = ctx.from?.id; 
        if(!userId) return; 

        const pending = PENDING_REQUESTS[userId];
        if(!pending || pending.type !== "SEND_TOKEN") return; 

        const text = ctx.message.text.trim();

        if(!pending.to) {
            try {
                pending.to = text; 
                ctx.sendMessage("How much USDC do you want to send?", {
                    parse_mode: "Markdown", 
                });
            } catch (error) {
                console.log(error);
                await ctx.reply("Some error occured, please try again later"); 
                delete PENDING_REQUESTS[userId];
                return;
            }
        }
        const amount = Number(ctx.message.text);
        if (!Number.isFinite(amount) || amount <= 0) {
            await ctx.reply("Please enter a valid USDC amount, this transaction has being canceled, please try again");
            delete PENDING_REQUESTS[userId];
            return
        }

        if (!pending.to) {
            delete PENDING_REQUESTS[userId];
            return;
        }

        try{
            const sender = USERS[userId];
            const receiver = new PublicKey(pending.to);
            // Devnet USDC MINT address 
            const USDC_MINT = new PublicKey(
                env.USDC_MINT
            );
            if(!sender){
                delete PENDING_REQUESTS[userId];
                return; 
            }

            const senderATA = await getAssociatedTokenAddress(
                USDC_MINT,
                sender.publicKey
            );
            
            const senderInfo = await connection.getAccountInfo(senderATA);
            if(!senderInfo){
                await ctx.reply("Sender doesnot have a USDC token ATA");
                delete PENDING_REQUESTS[userId]; 
                return; 
            }

            const receiverATA = await getAssociatedTokenAddress(
                USDC_MINT,
                receiver
            );

            const tx = new Transaction();
            const receiverInfo = await connection.getAccountInfo(receiverATA);
            if (!receiverInfo) {
                tx.add(
                    createAssociatedTokenAccountInstruction(
                        sender.publicKey,
                        receiverATA,
                        receiver,
                        USDC_MINT
                    )
                );
            }

            tx.add(
                createTransferInstruction(
                    senderATA,
                    receiverATA,
                    sender.publicKey,
                    amount * 1_000_000 // USDC decimals
                )
            );

            const sig = await sendAndConfirmTransaction(
                connection,
                tx,
                [sender]
            );

            await ctx.sendMessage(
                `*USDC Sent Successfully*\n\n` +
                `Amount: *${amount} USDC*\n` +
                `Tx: \`${sig}\``,
                { 
                    parse_mode: "Markdown",
                    ...Keyboard 
                }
            );

            delete PENDING_REQUESTS[userId]; 
                

        } catch (error) {
            console.error(error);
            await ctx.reply("❌ Token transfer failed");
            delete PENDING_REQUESTS[userId];
        }
        return; 
    })
}