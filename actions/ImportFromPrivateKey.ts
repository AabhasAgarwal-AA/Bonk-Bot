import { Keypair } from "@solana/web3.js";
import Keyboard from "./Keyboard";
import { message } from "telegraf/filters";
import bs58 from "bs58";

export function importFromPrivateKey(bot: any, USERS: Record<string, Keypair>){
    bot.action('import_private_key', async (ctx: any) => {
        try{
            await ctx.answerCbQuery('Importing from the private key');
            await ctx.sendMessage(
                `⚠️ *Security Warning*\n\n` +
                `• Never share your private key with anyone\n` +
                `• This chat is NOT encrypted\n` +
                `• Only proceed if you trust this bot\n\n` +
                `Send your *Base58 private key* in the next message.\n\n`,
                { parse_mode: 'Markdown' }
            );

            

        } catch (error) {
            console.log(error); 
            await ctx.answerCbQuery('❌ Failed to generate wallet from the given private key'); 
            return ctx.reply('❌ An error occurred. Please try again.');

        }
    }); 

    bot.on(message("text"), async (ctx: any) => {
        const userId = ctx.from?.id;
        if (!userId) return;

        const privateKeyInput = ctx.message.text.trim(); 
        // console.log(ctx.message);
        try{
            await ctx.deleteMessage();

            const secretKey = bs58.decode(privateKeyInput);
            const keypair = Keypair.fromSecretKey(secretKey);

            USERS[userId] = keypair; 

            ctx.sendMessage(`Wallet generated from the given private key`, {
                parse_mode: 'Markdown',
                ...Keyboard
            });

        } catch (error) {
            console.log(error); 
            await ctx.reply('❌ Invalid private key. Please try again.');
            return ctx.reply('❌ An error occurred. Please try again.');
        } 
    })
}

