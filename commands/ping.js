const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Replies with the bot's ping!"),
	async execute(interaction) {
		await interaction.reply(`🏓Latency is ${Date.now() - interaction.createdTimestamp}ms.`);
	},
};