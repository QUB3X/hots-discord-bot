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
const express = require('express')
const path = require('path')
const sanitize = require('sanitize')

const app = express()
const bot = new Eris(process.env.DISCORD_BOT_TOKEN) // Replace DISCORD_BOT_TOKEN in .env with your bot accounts token

const URL = process.env.API_URL

app.use(sanitize.middleware)

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/index.html')))
app.listen(process.env.PORT);

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
  if(msg.content.startsWith('!register')) {
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
    // If no 2 args
    } else {
      bot.createMessage(msg.channel.id, 
                        msg.member.username +
                        ', to register please tell me your BattleTag and region with ```!register YourBattleTagHere#1234 <Region>```\n' +
                        'Replace **<Region>** with the region of the server you play in, choosing between `EU`, `NA` (LUL), `KR`, `CN`'
      )
    }
  } // register
  
  if(msg.content.startsWith('!help')) {
    bot.createMessage(msg.channel.id, '👉 Here\'s a list of all available commands:\n' + 
                                      '`!register <BattleTag#1234> <Region>`\n' +
                                      '`!mmr`\n`!winrate`\n`!timeplayed`\n`!mytopheroes <Quantity>`\n`!mymains <Quantity>`')
  } // help

  if(msg.content.startsWith('!mmr')) {

    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    fetchPlayerData(msg, (player) => {
      bot.createMessage(msg.channel.id, 
            `Hi ${msg.member.username}, here's your MMR:\n
**Team League**:  ${player.teamLeague}\n
**Hero League**:  ${player.heroLeague}\n
**Quick Match**:  ${player.quickMatch}\n
**Unranked Draft**:  ${player.unrankedDraft}`)
    })
  } // mmr
  
  if(msg.content.startsWith('!winrate')) {
    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    
    fetchPlayerData(msg, (player) => {
      player.winrate += (player.winrate > 50) ? "% 😄" : "% 😦"
      bot.createMessage(msg.channel.id, `${msg.member.username}, your winrate is ${player.winrate}!`)
    })
  } // winrate
  
  if(msg.content.startsWith('!timeplayed')) {
    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    
    fetchPlayerData(msg, (player) => {
      bot.createMessage(msg.channel.id, `${msg.member.username}, you played for ${player.timePlayed}!`)
    })
  } // time played
  
  if(msg.content.startsWith('!mvp')) {
    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    
    fetchPlayerData(msg, (player) => {
      bot.createMessage(msg.channel.id, `${msg.member.username}, you've been MVP in the ${player.MVPrate}% of your games!`)
    })
  } // mvp
  
  if(msg.content.startsWith('!gamesplayed')) {
    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    
    fetchPlayerData(msg, (player) => {
      bot.createMessage(msg.channel.id, `${msg.member.username}, you've played ${player.gamesPlayed} games (probably more)!`)
    })
  } // games played
  
  /*
    There is this thing called Discord Embed, similar to MD Card.
  */
  
  if(msg.content.startsWith('!mytopheroes')) {
    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    
    fetchPlayerData(msg, (player) => {
      const heroes = player.heroes // array
      const arg = msg.content.split(" ")
      const howManyHeroes = (arg[1]) ? arg[1] : 3
      var output = "";
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
      heroes.sort((a, b) => {
                
      })
      
      for (var i = 0; i < howManyHeroes; i++) {
        let hero = heroes[i]
        output += `(${i+1}) ${hero.winrate}% WR   ${hero.name} (${hero.gamesPlayed} Games)\n`
      }
      
      const embed = {embed: {
          color: 3447003,
          url: "https://hots-discord-bot.glitch.me/",
          fields: [{
              name: msg.member.username + "'s Top Heroes",
              value: "`" + output + "`",
          }]
        }
      }
      
      bot.createMessage(msg.channel.id, embed)
    })
  } // my top heroes
  
  if(msg.content.startsWith('!mymains')) {
    // Simulate bot typing
    bot.sendChannelTyping(msg.channel.id)
    
    fetchPlayerData(msg, (player) => {
      const heroes = player.heroes // array
      const arg = msg.content.split(" ")
      const howManyHeroes = (arg[1]) ? arg[1] : 3
      var output = "";
      
      // heroes are already sorted by winrate
      //heroes.sort((a,b) => {return a.winrate - b.winrate})
      
      for (var i = 0; i < howManyHeroes; i++) {
        let hero = heroes[i]
        output += `${hero.name} - ${hero.winrate}% winrate - ${hero.gamesPlayed} games\n`
      }
      
      bot.createMessage(msg.channel.id, `${msg.member.username}, here's your top ${howManyHeroes} heroes by games played:\n${output}`)
    })
  } // player's mains
}) // end of commands


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