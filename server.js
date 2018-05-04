const Eris = require('eris');

// init sqlite db
var fs = require('fs');
var dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

const bot = new Eris(process.env.DISCORD_BOT_TOKEN);   // Replace DISCORD_BOT_TOKEN in .env with your bot accounts token


bot.on('ready', () => {                                // When the bot is ready
    console.log('Ready!');                             // Log "Ready!"
});
 
bot.on('messageCreate', (msg) => {                     // When a message is created
    if(msg.content.includes('1337')) {                 // If the message content includes "1337"
        bot.createMessage(msg.channel.id, 'damn it');  // Send a message in the same channel with "damn it"
    }
});
 
bot.connect();                                         // Get the bot to connect to Discord