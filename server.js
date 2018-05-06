// import discord API lib
const Eris = require('eris')

// init sqlite db
const fs = require('fs')
const dbFile = '.data/sqlite.db'
const exists = fs.existsSync(dbFile)
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(dbFile)

// add other libs
const request = require('request')

const bot = new Eris(process.env.DISCORD_BOT_TOKEN);   // Replace DISCORD_BOT_TOKEN in .env with your bot accounts token

const URL = "https://hotslogs-api.glitch.me/api/v1/"

if (!exists) {
  // if ./.data/sqlite.db does not exist, create it, otherwise do stuff
  db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
            discord_id int PRIMARY KEY,
            hotslogs_id int,
            battle_tag text);`)
  console.log('New table users created!')
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
    
    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    
    const msgParts = msg.content.split(' ')
    if(msgParts[2]) {
      
      const discordId = msg.author.id
      const battleTag = msgParts[1].replace("#", "_").toLowerCase()
      const region = msgParts[2].toUpperCase()
      
      // const idRegex = new RegExp('* # [0-9]$')
      const regionRegex = new RegExp('EU|NA|KR|CN')
      
      if(regionRegex.test(region)) {
        // Ask Hotslogs for the page
        request(URL + "players/battletag/" + region + "/" + battleTag, (err, resp, data) => {
        // If everything is ok
          //console.log("Requesting: " + URL + "players/battletag/" + region + "/" + battleTag.replace("#", "_"))
          if(!err && resp.statusCode == 200) {
            console.log("Parsing...")
            const hotslogsId = JSON.parse(data).id

            db.serialize(() => {
              db.run(`INSERT OR REPLACE INTO users (discord_id, hotslogs_id, battle_tag) VALUES(${discordId}, ${hotslogsId}, '${battleTag}');`)
            })
            bot.createMessage(msg.channel.id, 'Great! I\'ve just added your IDs to my database! Now just ask your MMR with `!mmr`')
          } else {
            bot.createMessage(msg.channel.id, 'Sorry, but I can\'t find your profile 😢')
          }
        })
      } else {
        bot.createMessage(msg.channel.id, 'Seems your entered a wrong region code! Only `EU`, `NA`, `KR`, `CN` are valid!')
      }
    } else {
      bot.createMessage(msg.channel.id, 'Ok ' + msg.member.username +
                        ', tell me your BattleTag with ```!register YourBattleTagHere#1234 <Region>```' +
                        '\nReplace **<Region>** with the region of the server you play in, choosing between `EU`, `NA` (LUL), `KR`, `CN`' +
                        '\nMake sure your BattleTag is correct!'
      )
    }
  }
  if(msg.content.includes('!help')) {
    bot.createMessage(msg.channel.id, '👉 Here\'s a list of all available commands: none KEK')
  }
  
  if(msg.content.includes('!mmr')) {
    
    db.all(`SELECT (discord_id) FROM users WHERE discord_id = ${msg.author.id}`, (err, rows) => {
      
    })
    
    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    request(URL + "players/" + hotslogsId, (err, resp, data) => {
      if(!err && resp.statusCode == 200) {
        console.log("Parsing...")
        const hotslogsId = JSON.parse(data).id

        db.serialize(() => {
          db.run(`INSERT OR REPLACE INTO users (discord_id, hotslogs_id, battle_tag) VALUES(${discordId}, ${hotslogsId}, '${battleTag}');`)
        })
        bot.createMessage(msg.channel.id, 'Great! I\'ve just added your IDs to my database! Now just ask your MMR with `!mmr`')
      } else {
        bot.createMessage(msg.channel.id, 'Whoops, something went wrong 😢')
      }
    })
  }
})
 


// UTILITY
function listAllUsers(){
  var query = "SELECT * FROM users";
  db.all(query, function (err, rows) {
    if(err){
        console.log(err);
    }else{
      for(let row of rows) {
        console.log(row.discord_id + " " + row.hotslogs_id + " "+ row.battle_tag)
      }
    }
  })
}

bot.connect();                                         // Get the bot to connect to Discord