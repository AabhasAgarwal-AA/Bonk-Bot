import { Telegraf } from 'telegraf';
import { env } from "./env";
import { Keypair } from "@solana/web3.js";
import { welcomeMessage } from './actions/WelcomeMessage';
import { registerGenerateWallet } from './actions/GenerateWallet';
import { importFromPrivateKey } from './actions/ImportFromPrivateKey';
import { viewAddress } from './actions/ViewAddress';
import { exportPrivateKey } from './actions/ExportPrivateKey';
import { checkBalance } from './actions/CheckBalance';
import { transactionHistory } from './actions/TransactionHistory';
import { sendSol } from './actions/SendSol';
import { sendToken } from './actions/SendToken';


const bot = new Telegraf(env.BOT_TOKEN);
const USERS: Record<string, Keypair> = {};
const PENDING_REQUESTS: Record<string, {
    type: "SEND_SOL" | "SEND_TOKEN", 
    amount?: number, 
    to?: string 
}> = {};

welcomeMessage(bot);
registerGenerateWallet(bot, USERS);
importFromPrivateKey(bot, USERS);
viewAddress(bot, USERS);
exportPrivateKey(bot, USERS);
checkBalance(bot, USERS);
transactionHistory(bot, USERS);
sendSol(bot, USERS, PENDING_REQUESTS);
sendToken(bot, USERS, PENDING_REQUESTS);

await bot.launch();