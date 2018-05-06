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

// bot.on('ready', () => {                                // When the bot is ready
//     console.log('Ready!');                             // Log "Ready!"
// })

// When a message is created do stuff:
bot.on('messageCreate', (msg) => {
  // dont reply to other bots
  if (msg.author.bot) return
  
  // If user want to link his accounts
  if(msg.content.includes('!register')) {
    // Ask user for his account handles
    // member = local name
    // author = global name
    // https://abal.moe/Eris/docs/User

    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)

    const msgParts = msg.content.split(' ')
    if(msgParts.length == 3) {

      const discordId = msg.author.id
      let battleTag = msgParts[1]
      let region = msgParts[2].toUpperCase()

      const battletagRegex = new RegExp('^[A-zÀ-ú][A-zÀ-ú0-9]{2,11}#[0-9]{4,5}$')  // https://eu.battle.net/support/en/article/26963
      const regionRegex    = new RegExp('EU|NA|KR|CN')
      
      if(!battletagRegex.test(battleTag)){
        bot.createMessage(msg.channel.id, 'Please enter a valid BattleTag!')
        return
      }
      
      if(!regionRegex.test(region)){
        bot.createMessage(msg.channel.id, 'Please enter a valid region: `EU`, `NA`, `KR`, `CN`')
        return
      }
      
      // Ask Hotslogs for the page
      battleTag = battleTag.replace("#", "_")
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
    // If no 3 args
    } else {
      bot.createMessage(msg.channel.id, 
                        msg.member.username +
                        ', to register please tell me your BattleTag and region with ```!register YourBattleTagHere#1234 <Region>```\n' +
                        'Replace **<Region>** with the region of the server you play in, choosing between `EU`, `NA` (LUL), `KR`, `CN`'
      )
    }
  }
  if(msg.content.includes('!help')) {
    bot.createMessage(msg.channel.id, '👉 Here\'s a list of all available commands: none KEK')
  }

  if(msg.content.includes('!mmr')) {

    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    fetchPlayerData(msg, (player) => {
      bot.createMessage(msg.channel.id, "Hi " + msg.member.username + ", here's your MMR:\n" +
            "**Team League**:  " + player.teamLeague + "\n" +
            "**Hero League**:  " + player.heroLeague + "\n" +
            "**Quick Match**:  " + player.quickMatch + "\n" +
            "**Unranked Draft**:  " + player.unrankedDraft + "\n")
    })
  }
})

/*
  - Winrate
  - Time played
  - Best winrate on maps
  - Top 3 heroes by winrate
  - Last 3 heroes by winrate
  - Is last hero op?
*/


////////////////////////////////////////////////////////////
// UTILITY /////////////////////////////////////////////////
////////////////////////////////////////////////////////////
function fetchPlayerData(msg, callback) {
  db.all(`SELECT hotslogs_id id, discord_id discord FROM users WHERE discord_id = ${msg.author.id}`, (err, rows) => {
    if(err) {
      console.log(err)
      bot.createMessage(msg.channel.id, 'Whoops, something went wrong 😢')
    } else {
      const hotslogsId = rows[0].id

      request(URL + "players/" + hotslogsId, (err, resp, data) => {
        if(!err && resp.statusCode == 200) {
          const player = JSON.parse(data)
          
          callback(player)
        } else {
          console.log(err)
          bot.createMessage(msg.channel.id, 'Whoops, something went wrong 😢')
        }
      })
    }
  })
}

function fetchHeroData(msg, heroName, callback) {

  request(URL + "heroes/" + heroName, (err, resp, data) => {
    if(!err && resp.statusCode == 200) {
      const hero = JSON.parse(data)

      callback(hero)
    } else {
      console.log(err)
      bot.createMessage(msg.channel.id, 'Whoops, something went wrong 😢')
    }
  })
}

function fetchWinrates(msg, callback) {

  request(URL + "heroes", (err, resp, data) => {
    if(!err && resp.statusCode == 200) {
      const hero = JSON.parse(data)

      callback(hero)
    } else {
      console.log(err)
      bot.createMessage(msg.channel.id, 'Whoops, something went wrong 😢')
    }
  })
}

function listAllUsers(){
  var query = "SELECT * FROM users";
  db.all(query, (err, rows) => {
    if(err){
        console.log(err)
    }else{
      for(let row of rows) {
        console.log(row.discord_id + " " + row.hotslogs_id + " "+ row.battle_tag)
      }
    }
  })
}

bot.connect(); // Get the bot to connect to Discord