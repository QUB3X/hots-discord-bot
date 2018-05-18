# Heroes of the Storm Discord Bot

A bot that provides infos and stats about the players.

## Running it

1)  `git clone` this repo.

2)  Create `.env` file in `/` and add the following lines:
    ```
    DISCORD_BOT_TOKEN=123456789-abcdefghijklmnopqrstuvwxyz
    API_URL=http://heroes-api.ml/  # dont forget the trailing '/'
    ```
    P.S.: Generate your token key from [Discord Developer Page](https://discordapp.com/developers/applications)

3)  Run `mkdir .data`.

4)  Run `node server.js`.


We're using the [Eris](https://npm.im/eris) library to interact with the Discord API.
