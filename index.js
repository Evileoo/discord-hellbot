// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Collection, Partials, REST, Routes, Events } = require("discord.js");
const { token, clientId, guildId } = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");
require("./database/db.connection");

//create a client instance
const client = new Client({
  intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildVoiceStates
	],
  partials: [
    Partials.Channel
  ],
});

//Create the collection of commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

//Setup handhelded events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

//deploy bot's commands
require("./deploy-commands");

// Log in to Discord with the client's token
client.login(token);