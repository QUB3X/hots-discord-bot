const Eris = require('eris');

// init sqlite db
const fs = require('fs');
const dbFile = './.data/sqlite.db';
const exists = fs.existsSync(dbFile);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbFile);

const bot = new Eris(process.env.DISCORD_BOT_TOKEN);   // Replace DISCORD_BOT_TOKEN in .env with your bot accounts token

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run('CREATE TABLE Users (discordId TEXT PRIMARY KEY NOT NULL, hotslogsId TEXT NOT NULL, battleTag TEXT NOT NULL)')
    console.log('New table Users created!')
  }
})

function addUser (discordId, hotslogsId, battleTag) {
  // insert default dreams
  db.serialize(() => {
    db.run(`INSERT INTO Users (discordId, hotslogsId, battleTag) VALUES (${discordId}, ${hotslogsId}, ${battleTag})`);
  })
}

bot.on('ready', () => {                                // When the bot is ready
    console.log('Ready!');                             // Log "Ready!"
});
 
bot.on('messageCreate', (msg) => {
  // When a message is created
  if(msg.content.includes('!register')) {
    msg.createMessage(msg.channel.id, `Ok $(msg.author), what's your BattleTag?`)
  }
  if(msg.content.includes('1337')) {
    // If the message content includes "1337"
    bot.createMessage(msg.channel.id, 'damn it');
    // Send a message in the same channel with "damn it"
  }
});
 
bot.connect();                                         // Get the bot to connect to Discord