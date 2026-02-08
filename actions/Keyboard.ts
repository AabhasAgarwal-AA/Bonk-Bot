import {  Markup } from 'telegraf';

const Keyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback('🔑 Generate Wallet', 'generate_wallet'),
    ],
    [
        Markup.button.callback('🔑 Import from Private key', 'import_private_key'),
    ],
    [
        Markup.button.callback('👁️ View Address', 'view_address'),
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
]);

export default Keyboard;