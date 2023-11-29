require('dotenv/config'); //Load environment variables to access bot token and API key
const { Client } = require('discord.js'); //Import the Discord module to interact with the Discord API
const { OpenAI } = require('openai'); //Import the OpenAI module to interact with the OpenAI API

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});
//Intents tell Discord which events the bot needs to receive

client.on('ready', () => {
    console.log('The bot is online.');
});
//Log a message into console when the bot is online.

const IGNORE_PREFIX = "!"; //tell the bot to ignore your message when it starts with !
const CHANNELS = ["Your discord channel's ID"] //Give access to specified text channels

const openai = new OpenAI({
    apiKey: process.env.OpenAI_KEY,
})
//initialize OpenAI object with API key

client.on('messageCreate', async (message) => {
    //if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!message.mentions.users.has(client.user.id)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    await message.channel.sendTyping();
    //Asynchronously checks for new messages in channel

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);
    //Sends typing indicator show that it's processing a response

    let convo = [];
    convo.push({
        name: 'Vivius',
        role: 'system',
        content: 'Extremely knowledgeable philosophical thinker',
    })

    let prevMsg = await message.channel.messages.fetch({ limit: 27});
    prevMsg.reverse(); //reverse the array so that messages so GPT contextualizes messages in the order they were sent
    //Fetches last 27 messages to receive context for the conversation

    prevMsg.forEach((msg) => { 
        //Iterates over every message in previousMsg array containing 27 previously fetched messages
        if (msg.content.startsWith(IGNORE_PREFIX)) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
        //removes non-word characters in usernames

        const messageContent = msg.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
        //replaces bots @mention so the bot doesn't think it's talking to itself

        if (msg.author.bot) { //checks if message is from a bot
            if (msg.author.id === 'specific bot ID') {
                convo.push({
                    // Determine if the message is from a specific bot then pushes message to the end of conversation array
                    role: 'user',
                    name: 'Vivi',
                    content: messageContent,
                });
            } else if (msg.author.id === 'specific bot ID') {
                convo.push({
                    role: 'user',
                    name: 'Margot',
                    content: messageContent,
                });
            } else if (msg.author.id === client.user.id) {
                convo.push({
                    role: 'assistant',
                    name: username,
                    content: messageContent,
                });
                //For messages from the bot itself, push an object to convo as an assistant role
            } else {
                // Handle messages from other bots
            }
        } else {
            convo.push({
                role: 'user',
                name: username,
                content: messageContent,
            });
            //Handle messages from human users
        }
    });
    /*Builds the conversation Array from pushing messages to the end of the convo array for proper contextualization of previous 
    messages. These messages are sent to OpenAI and then processed by the GPT-4 model for an appropriate response*/

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: convo,
    })
    //Sends conversation history to OpenAI's GPT-4 model and waits for response

    .catch((error) => console.error('OpenAI Error:\n', error));

    clearInterval(sendTypingInterval);

    if (!response) {
        message.reply("I'm having issues with OpenAI, please check the terminal");
        return;
    }
    //Logs errors in the console

    const respondTo = response.choices[0].message.content;
    const sizeLimit = 2000;

    for (let i = 0; i < respondTo.length; i += sizeLimit) {
        const chunk = respondTo.substring(i, i + sizeLimit);

        await message.reply(chunk);
    }

})

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Example command: "!ban @user"
    if (message.content.startsWith('!ban')) {
        // Ensure the member issuing the command has permission to ban
        if (!message.member.permissions.has('BAN_MEMBERS')) {
            return message.reply('You do not have permission to ban members.');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('Please mention the user you want to ban.');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('That user is not in this server.');
        }

        // Optional: reason for the ban
        const reason = message.content.split(' ').slice(2).join(' ') || 'No reason provided';

        // Ban the member
        try {
            await member.ban({ reason: reason });
            message.reply(`${user.tag} has been banned for reason: ${reason}`);
        } catch (error) {
            console.error('Error trying to ban:', error);
            message.reply('I was unable to ban the member.');
        }
    }

    
});

let isPaused = false; // Variable to track the pause state

client.on('messageCreate', async message => {
    // Check if the message is a pause command
    if (message.content === '!pause') {
        isPaused = true;
        await message.reply('Bot is now paused.');
        return;
    }

    // Check if the message is a resume command
    if (message.content === '!resume') {
        isPaused = false;
        await message.reply('Bot is now active.');
        return;
    }

    // If the bot is paused, do not process any other commands
    if (isPaused) return;
});

client.on('messageCreate', async message => {
    //commands used to mention specific bots to initiate a conversation between bots

    const viviId = '1177125647383019520';  //user IDs of specific bots you want to mention
    const margotId = '1178822415351038102';

    if (message.content.startsWith('!mentionvivi')) {
        // Check if the message starts with '!mention'
        
        const args = message.content.split(' ').slice(1);
        // Split the message by spaces and remove the first element ('!mention')

        const text = args.join(' ');
        // Join the remaining elements to form the message

        const mention = `<@${viviId}>`;
        // Construct the mention string

        message.channel.send(`${mention}, ${text}`);
        // Send a message mentioning the other bot followed by the custom text
    }

    if (message.content.startsWith('!mentionmargot')) {
        const args = message.content.split(' ').slice(1);
        // Split the message by spaces and remove the first element ('!mentionmargot')

        const text = args.join(' ');
        // Join the remaining elements to form the message

        const mention = `<@${margotId}>`;
        // Construct the mention string

        message.channel.send(`${mention}, ${text}`);
        // Send a message mentioning the other bot followed by the custom text
    }
});


client.on('messageCreate', async message => {
    if (message.content === '!shutdown') {
        // Check if the message calls for shutdown
        await message.reply('Shutting down...');
        client.destroy(); // Closes the connection to Discord
        process.exit(); // Shuts down the bot
       
    }

});

client.login(process.env.TOKEN);
//Logs in the Discord bot using its token