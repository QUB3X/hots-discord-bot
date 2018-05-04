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
    db.run('CREATE TABLE Users (discordId INT PRIMARY KEY NOT NULL, hotslogsId TEXT, battleTag TEXT)')
    console.log('New table Users created!')
  }
})

function addUser (discordId, hotslogsId, battleTag) {
  // insert default dreams
  db.serialize(() => {
    db.run('INSERT INTO Users (discordId, hotslogsId, battleTag) VALUES (' + discordId + ',' + hotslogsId + ',' + battleTag + ');')
  })
}

bot.on('ready', () => {                                // When the bot is ready
    console.log('Ready!');                             // Log "Ready!"
});
 
bot.on('messageCreate', (msg) => {
  // When a message is created do stuff:
  
  // If user want to link his accounts
  if(msg.content.includes('!register')) {
    // Ask user for his account handles
    // member = local name
    // author = global name
    // https://abal.moe/Eris/docs/User
    const msgParts = msg.content.split(' ')
    if(msgParts[2]) {
      const discordId = msg.author.id
      const battleTag = msgParts[1]
      const hotslogsId = parseInt(msgParts[2])
      
      // TODO: check if battletag and hotslogsId are correct (REGEX?)
      addUser(discordId, battleTag, hotslogsId)
      
    } else {
      bot.createMessage(msg.channel.id, 'Ok ' + msg.member.username +
        ', tell me your BattleTag with ```!battletag YourBattleTagHere#1234```' +
        '\nMake sure your BattleTag is correct!')
    }
  }
    
  /*
  if(msg.content.includes('1337')) {
    // If the message content includes "1337"
    bot.createMessage(msg.channel.id, 'damn it');
    // Send a message in the same channel with "damn it"
  }
  */
  if(msg.content.includes('!help')) {
    bot.createMessage(msg.channel.id, '👉 Here\'s a list of all available commands: none KEK')
  }
});
 
bot.connect();                                         // Get the bot to connect to Discord