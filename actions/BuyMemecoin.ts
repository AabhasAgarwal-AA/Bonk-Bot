import { getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { message } from "telegraf/filters";
import { env } from "../env";
import fetch from "cross-fetch";
import Keyboard from "./Keyboard";


const connection = new Connection(env.CONNECTION_URL);

export function buyMemecoin(bot: any, USERS: Record<string, Keypair>, PENDING_REQUESTS: Record<string, {
    type: "SEND_SOL" | "SEND_TOKEN" | "BUY_MEMECOIN" | "SEND_MEMCOIN", 
    amount?: number, 
    to?: string
}>){
    bot.action('buy_memecoin_menu', async (ctx: any) => {
        try{
            const userId = ctx.from?.id; 
            if(! userId) return; 

            if(!USERS[userId]){
                return ctx.reply("You don't have a wallet yet...");
            }

            ctx.answerCbQuery();
            ctx.sendMessage("Please share the address of the meme coin you want to buy....");

            PENDING_REQUESTS[userId] = {
                type: "BUY_MEMECOIN" 
            };

        } catch (error) {
            console.log(error); 
            await ctx.answerCbQuery('❌ Failed to buy memecoin');
            await ctx.reply('❌ An error occurred. Please try again.');
        }
    }); 

    bot.on(message("text"), async (ctx: any) => {
        const userId = ctx.from?.id; 
        if(! userId){
            delete PENDING_REQUESTS[userId];
            return;
        } 

        const pending = PENDING_REQUESTS[userId]; 
        if(!pending || pending.type !== "BUY_MEMECOIN"){ 
            delete PENDING_REQUESTS[userId];
            return;
        } 

        const text = ctx.message.text.trim(); 

        if(!pending.to){
            try { 
                pending.to = text; 
                ctx.sendMessage("How much worth (in USDC) of meme coin do you want to buy ?", {
                    parse_mode: "Markdown"
                });
            } catch (error) {
                console.log(error);
                await ctx.reply("some error occured, please try again later");
                delete PENDING_REQUESTS[userId]; 
                return; 
            }
        }

        if (!pending.to) {
            delete PENDING_REQUESTS[userId];
            return;
        }

        // check if the meme coin address exists on the blockchain or not 
        try {
            const mintPubkey = new PublicKey(pending?.to); 
            await getMint(connection, mintPubkey);
        } catch (error){
            console.log(error); 
            await ctx.reply("Either the meme coin address is invalid or this meme coin does not exist");
            delete PENDING_REQUESTS[userId];
            return;
        }

        const amount = Number(ctx.message.text); 
        if(!Number.isFinite(amount) || amount <= 0){
            await ctx.reply("Please enter a valid USDC amount");
            delete PENDING_REQUESTS[userId];
            return; 
        }; 

        
        try{
            const sender = USERS[userId];
            if(! sender){
                delete PENDING_REQUESTS[userId];
                return;
            } 

            const inputMint = new PublicKey(
                env.USDC_MINT
            ); 
            const user_USDC_ATA =  await getAssociatedTokenAddress(
                inputMint, 
                sender.publicKey
            );
            const user_USDC_Info = await connection.getAccountInfo(user_USDC_ATA);
            if(! user_USDC_Info){
                await ctx.reply("User doesnot have USDC token ATA");
                delete PENDING_REQUESTS[userId];
                return;
            } 

            const outputMint = new PublicKey(
                pending.to 
            );

            const amountInSmallestUnit = Math.floor(amount * 1_000_000);

            const quotesRes = await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint.toBase58()}&outputMint=${outputMint.toBase58()}&amount=${amountInSmallestUnit}&slippageBps=50`
            );
            const quote = await quotesRes.json(); 
            if(! quote?.data.lenght){
                await ctx.reply("No liquidity found for this token");
                delete PENDING_REQUESTS[userId];
                return; 
            }

            const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
                method: "POST", 
                headers: {"Content-Type": "application/json"}, 
                body: JSON.stringify({
                    quoteResponse: quote.data[0], 
                    userPublicKey: sender.publicKey.toBase58(), 
                    wrapAndUnwrapSol: true 
                }), 
            }); 

            const swapData = await swapRes.json(); 

            const transactionBuffer = Buffer.from(swapData.swapTransaction, "base64"); 
            const transaction = VersionedTransaction.deserialize(transactionBuffer);


            transaction.sign([sender]);

            const signature = await connection.sendRawTransaction(transaction.serialize());

            await ctx.sendMessage(
                `🔥 *Memecoin Purchased Successfully*\n\n` +
                `💰 Spent: *${amount} USDC*\n` +
                `🔗 Tx:\n\`${signature}\``,
                { 
                    parse_mode: "Markdown", 
                    ...Keyboard 
                }
            ); 


            delete PENDING_REQUESTS[userId];
             
        } catch (error) {
            console.log(error);
        }
    })

}