import Keyboard from './Keyboard';

export function welcomeMessage(bot: any){
    bot.start(async (ctx: any) => {
        const userId = ctx.from?.id;
        if (!userId) return;


        let welcomeMessage = `
🤖 **Welcome to Solana Wallet Bot!**

Your secure, easy-to-use Solana wallet manager.

**Features:**
• 🔑 Generate new wallets
• 📋 Import existing wallets
• 💰 Check balances
• 💸 Send SOL and SPL tokens
• 📊 View transaction history
• 🔒 Secure private key storage

**Security:**
• All private keys are encrypted
• Never share your private keys
• Use at your own risk (testnet recommended)

Choose an option below to get started:`;
        return ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            ...Keyboard
        });
    });
}