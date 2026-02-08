import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { message } from "telegraf/filters";
import { env } from "../env";
import Keyboard from "./Keyboard";

const connection = new Connection(env.CONNECTION_URL);

export function sendMemecoin(bot: any, USERS: Record<string, Keypair>, PENDING_REQUESTS: Record<string, {
    type: "SEND_SOL" | "SEND_TOKEN" | "BUY_MEMECOIN" | "SEND_MEMCOIN", 
    amount?: number, 
    to?: string 
}>){
    bot.action('send_memecoin_menu', async (ctx: any) => {
        try {
            const userId = ctx.from?.id; 
            if(! userId) return; 

            if(!USERS[userId]){
                await ctx.reply("You do not have a wallet"); 
                return;
            }

            ctx.answerCbQuery();
            ctx.sendMessage("Please share the address of the person you want to send the memecoin to...."); 

            PENDING_REQUESTS[userId ] = {
                type: "SEND_MEMCOIN"
            };
            
        } catch (error) {
            console.log(error); 
            await ctx.answerCbQuery('❌ Failed to send USDC'); 
            await ctx.reply('❌ An error occured, please try again again');
            return; 
        }
    });

    bot.on(message("text"), async (ctx: any) => {
        const userId = ctx.from?.id; 
        if(!userId) return; 

        const pending = PENDING_REQUESTS[userId]; 
        if(!pending || pending.type !== "SEND_MEMCOIN") return; 

        const text = ctx.message.text.trim();

        if(! pending.to){
            try {
                pending.to = text; 
                ctx.message("How much amount of memecoin do you want to send to the reciver ?", {
                    parse_mode: "Markdown"
                });
            } catch (error) {
                console.log(error);
                await ctx.reply("Some error occured, please try again later");
                delete PENDING_REQUESTS[userId]; 
                return;
            }
        }

        const amount = Number(ctx.message.text);
        if(!Number.isFinite(amount) || amount <= 0){
            await ctx.reply("Please enter the valid number, this transaction has being canceled, please try again"); 
            delete PENDING_REQUESTS[userId]; 
            return; 
        }

        if(!pending.to){
            delete PENDING_REQUESTS[userId]; 
            return; 
        }

        ctx.message("please enter the memecoin address you want to send"); 
        const memecoinAddress = ctx.message.text.trim; 

        try {
            const sender = USERS[userId]; 
            const reciver = new PublicKey(pending.to); 

            const memecoinMint = new PublicKey(memecoinAddress); 

            if(!sender){
                delete PENDING_REQUESTS[userId]; 
                return; 
            }

            const senderATA = await getAssociatedTokenAddress(
                memecoinMint, 
                sender.publicKey
            ); 
            const senderInfo = await connection.getAccountInfo(senderATA); 
            if(! senderInfo){
                await ctx.reply("Sender doesnot have a meme coin ATA"); 
                delete PENDING_REQUESTS[userId]; 
                return; 
            }

            const receiverATA = await getAssociatedTokenAddress(
                memecoinMint, 
                reciver
            );
            const tx = new Transaction();
            const reciverInfo = await connection.getAccountInfo(receiverATA);
            if(!reciverInfo){
                tx.add(
                    createAssociatedTokenAccountInstruction(
                        sender.publicKey, 
                        receiverATA, 
                        reciver, 
                        memecoinMint
                    )
                );
            }

            tx.add(
                createTransferInstruction(
                    senderATA, 
                    receiverATA, 
                    sender.publicKey, 
                    amount
                )
            ); 

            const sig = await sendAndConfirmTransaction(
                connection, 
                tx, 
                [sender]
            ); 

            await ctx.sendMessage(
                `*Memecoin Sent Successfully*\n\n` +
                `Amount: *${amount} memecoin*\n` +
                `Tx: \`${sig}\``,
                {
                    parse_mode: "Markdown",
                    ...Keyboard
                }
            );

            delete PENDING_REQUESTS[userId]; 
            
        } catch (error) {
            console.log(error); 
            await ctx.reply("❌ Token transfer failed");
            delete PENDING_REQUESTS[userId];
        }
        return; 

    });

}