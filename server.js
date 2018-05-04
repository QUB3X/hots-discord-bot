// import discord API lib
const Eris = require('eris')

// init sqlite db
const fs = require('fs')
const dbFile = './.data/sqlite.db'
const exists = fs.existsSync(dbFile)
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(dbFile)

// add other libs
const request = require('request')

const bot = new Eris(process.env.DISCORD_BOT_TOKEN);   // Replace DISCORD_BOT_TOKEN in .env with your bot accounts token

const URL = "https://hotslogs-api.glitch.me/api/v1/"

function addUser (discordId, hotslogsId, battleTag) {
  try {
    db.serialize(() => {
      if (!exists) {
        // if ./.data/sqlite.db does not exist, create it, otherwise do stuff
        db.run('CREATE TABLE users (discordId INT PRIMARY KEY NOT NULL, hotslogsId TEXT, battleTag TEXT)')
        console.log('New table Users created!')
      } else {
        db.run('INSERT OR REPLACE INTO users (discordId, hotslogsId, battleTag) VALUES (' + discordId + ',' + hotslogsId + ',' + battleTag + ');')
      }
    })
  } catch (err) {
    console.log("Couldnt save to database: " + err)
  }
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
    bot.sendChannelTyping(msg.channel.id)
    
    const msgParts = msg.content.split(' ')
    if(msgParts[2]) {
      
      const discordId = msg.author.id
      const battleTag = msgParts[1].replace("#", "_")
      const region = msgParts[2]
      
      // const idRegex = new RegExp('* # [0-9]$')
      const regionRegex = new RegExp('EU|NA|KR|CH')
      
      if(regionRegex.test(region)) {
        // Ask Hotslogs for the page
        request(URL + "players/battletag/" + region + "/" + battleTag, (err, resp, data) => {
        // If everything is ok
          //console.log("Requesting: " + URL + "players/battletag/" + region + "/" + battleTag.replace("#", "_"))
          if(!err && resp.statusCode == 200) {
            console.log("Parsing...")
            const hotslogsId = JSON.parse(data).id
            console.log("Adding to db: " + discordId + " " + battleTag + " " + hotslogsId)

            addUser(discordId, battleTag, hotslogsId)
            bot.createMessage(msg.channel.id, 'Great! I\'ve just added your IDs to my database! Now just ask your MMR with `!mmr`')
          } else {
            bot.createMessage(msg.channel.id, 'Sorry, but I can\'t find your profile 😢')
          }
        })
      } else {
        bot.createMessage(msg.channel.id, 'Seems your entered a wrong region code! Only `EU`, `NA`, `KR`, `CH` are valid!')
      }
    } else {
      bot.createMessage(msg.channel.id, 'Ok ' + msg.member.username +
                        ', tell me your BattleTag with ```!register YourBattleTagHere#1234 <Region>```' +
                        '\nReplace **<Region>** with the region of the server you play in, choosing between `EU`, `NA` (LUL), `KR`, `CH`' +
                        '\nMake sure your BattleTag is correct!'
      )
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
})
 
bot.connect();                                         // Get the bot to connect to Discord