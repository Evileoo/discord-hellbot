const { SlashCommandBuilder,  PermissionsBitField, EmbedBuilder } = require("discord.js");
const mysql = require("mysql");
const { connect } = require("../database/db.connection");
const consts = require("../constants");

const connection = connect();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("logs")
		.setDescription("Affiche les sanctions d'un membre")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ViewAuditLog)
        .addUserOption( (option) =>
            option
            .setName("membre")
            .setDescription("Membre dont on veut voir les logs")
            .setRequired(true)
        )
        .addStringOption( (option) =>
            option
            .setName("type")
            .setDescription("Type du log recherché")
            .setRequired(true)
            .addChoices(
                { name: "ban", value: "ban" },
                { name: "kick", value: "kick" },    
                { name: "mute", value: "mute" },
                { name: "warn", value: "warn" },
                { name: "ALL", value: "all" }
            )
        ),
	async execute(interaction) {

        //get values
        const memberLogs = interaction.options.getMember("membre");
        const logType = interaction.options.getString("type");
        
        //checks if the bot gets perms to mute
        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)){
            return interaction.reply({
                embeds: [{
                    title: `Erreur !`,
                    description: `Je ne possède pas les droits pour accéder aux logs d'un membre`,
                    color: consts.EMBEDCOLOR
                }],
                ephemeral: true
            });
        }

        var reasons = ["", "", "", "", "", "", "", "", "", ""];
        var reasonsIndex = 0;

        var totalCount = 0;
        var banCount = 0;
        var kickCount = 0;
        var muteCount = 0;
        var warnCount = 0;
        
        var moreThanOneEmbed = false;

        //get logs of the user
        if(logType == "all"){
            connection.connect(function(err){
                if (err) throw err;
                //Database management requests
                connection.query("SELECT type, reason FROM hellbot_sanctions WHERE target_id = '"+memberLogs+"' AND server_id = '"+interaction.guild.id+"'", function (err, result, fields) {
                    if (err) throw err;
                    
                    //loop on results
                    for(i = 0; i < result.length; i++){
                        //counts amount of sanctions user took
                        totalCount++;
                        //counts amount of sanctions user took sorted by type + adapts reason
                        switch(result[i].type){
                            case "ban":
                                reasons[reasonsIndex] += "ban: "+result[i].reason+"\n";
                                banCount++;
                                break;
                            case "kick":
                                reasons[reasonsIndex] += "kick: "+result[i].reason+"\n";
                                kickCount++;
                                break;
                            case "mute":
                                reasons[reasonsIndex] += "mute: "+result[i].reason+"\n";
                                muteCount++;
                                break;
                            case "warn":
                                reasons[reasonsIndex] += "warn: "+result[i].reason+"\n";
                                warnCount++;
                                break;
                            default:
                                return interaction.reply(`Une erreur est survenue <@${ownerID}>: /logs all ${memberLogs.user.username}`);
                        }
                        //checks string length to know if an other embed have to be created
                        if(reasonsIndex == 0 && reasons[0].length > 774){
                            moreThanOneEmbed = true;
                            reasonsIndex++;
                        } else if(reasons[reasonsIndex].length > 3846){
                            reasonsIndex++;
                        }
                    }
                    //returns an embed depending on amount of sanctions
                    if(moreThanOneEmbed == false){
                        if(totalCount == 0){
                            const replyEmbed = new EmbedBuilder()
                            .setColor(consts.EMBEDCOLOR)
                            .setTitle(`${memberLogs.user.username} a pris ${totalCount} sanctions`)
                            .setDescription("Félicitations !")
                            .setAuthor({name: `Par: ${interaction.user.username}`})
                            .setTimestamp()
                            .setFooter({text: consts.EMBEDFOOTER});
                            return interaction.reply({embeds: [replyEmbed]});
                        } else {
                            const replyEmbed = new EmbedBuilder()
                            .setColor(consts.EMBEDCOLOR)
                            .setTitle(`${memberLogs.user.username} a pris ${totalCount} sanctions`)
                            .setAuthor({name: `Par: ${interaction.user.username}`})
                            .addFields(
                                { name: `bans`, value : `${banCount}`, inline: true },
                                { name: `kicks`, value : `${kickCount}`, inline: true },
                                { name: `mutes`, value : `${muteCount}`, inline: true },
                                { name: `warns`, value : `${warnCount}`, inline: true },
                                { name: `Raisons`, value : `${reasons[0]}` }
                            )
                            .setTimestamp()
                            .setFooter({text: consts.EMBEDFOOTER});
                            return interaction.reply({embeds: [replyEmbed]});
                        }
                        
                    } else {
                        for(i = 0; i <= reasonsIndex; i++){
                            if(i == 0){
                                const replyEmbed = new EmbedBuilder()
                                .setColor(consts.EMBEDCOLOR)
                                .setTitle(`${memberLogs.user.username} a pris ${totalCount} sanctions`)
                                .setAuthor({name: `Par: ${interaction.user.username}`})
                                .addFields(
                                    { name: `bans`, value : `${banCount}`, inline: true },
                                    { name: `kicks`, value : `${kickCount}`, inline: true },
                                    { name: `mutes`, value : `${muteCount}`, inline: true },
                                    { name: `warns`, value : `${warnCount}`, inline: true },
                                    { name: `Raisons`, value : `${reasons[0]}` }
                                )
                                .setTimestamp()
                                .setFooter({text: consts.EMBEDFOOTER});
                                interaction.message.send({embeds: [replyEmbed]});
                            } else {
                                const replyEmbed = new EmbedBuilder()
                                .setColor(consts.EMBEDCOLOR)
                                .setDescription(reasons[i]);

                                interaction.message.send({embeds: [replyEmbed]});
                            }
                        }
                    }
                    connection.end();
                });
            });
            
        } else {
            connection.connect(function(err){
                if (err) throw err;
                
                connection.query("SELECT reason FROM hellbot_sanctions WHERE target_id = '"+memberLogs+"' AND type = '"+logType+"' AND server_id = '"+interaction.guild.id+"'", function (err, result, fields) {
                    if (err) throw err;
                    
                    for(i = 0; i < result.length; i++){
                        totalCount++;
                        reasons[reasonsIndex] += result[i].reason+"\n";

                        if(reasonsIndex == 0 && reasons[0].length > 774){
                            moreThanOneEmbed = true;
                            reasonsIndex++;
                        } else if(reasons[reasonsIndex].length > 3846){
                            reasonsIndex++;
                        }
                    }
                    //returns an embed depending on amount of sanctions
                    if(moreThanOneEmbed == false){
                        if(totalCount == 0){
                            const replyEmbed = new EmbedBuilder()
                            .setColor(consts.EMBEDCOLOR)
                            .setTitle(`${memberLogs.user.username} a pris ${totalCount} ${logType}`)
                            .setDescription("Félicitations !")
                            .setAuthor({name: `Par: ${interaction.user.username}`})
                            .setTimestamp()
                            .setFooter({text: consts.EMBEDFOOTER});
                            return interaction.reply({embeds: [replyEmbed]});
                        } else {
                            const replyEmbed = new EmbedBuilder()
                            .setColor(consts.EMBEDCOLOR)
                            .setTitle(`${memberLogs.user.username} a pris ${totalCount} ${logType}`)
                            .setAuthor({name: `Par: ${interaction.user.username}`})
                            .addFields(
                                { name: `Raisons`, value : `${reasons[0]}` }
                            )
                            .setTimestamp()
                            .setFooter({text: consts.EMBEDFOOTER});
                            return interaction.reply({embeds: [replyEmbed]});
                        }
                        
                    } else {
                        for(i = 0; i <= reasonsIndex; i++){
                            if(i == 0){
                                const replyEmbed = new EmbedBuilder()
                                .setColor(consts.EMBEDCOLOR)
                                .setTitle(`${memberLogs.user.username} a pris ${totalCount} ${logType}`)
                                .setAuthor({name: `Par: ${interaction.user.username}`})
                                .addFields(
                                    { name: `Raisons`, value : `${reasons[0]}` }
                                )
                                .setTimestamp()
                                .setFooter({text: consts.EMBEDFOOTER});
                                interaction.message.send({embeds: [replyEmbed]});
                            } else {
                                const replyEmbed = new EmbedBuilder()
                                .setColor(consts.EMBEDCOLOR)
                                .setDescription(reasons[i]);

                                interaction.message.send({embeds: [replyEmbed]});
                            }
                        }
                    }
                    connection.end();
                });
            });
        }   
	},
};