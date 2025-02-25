const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Pour télécharger le fichier

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Joue un fichier MP3 dans le salon vocal')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('Le fichier MP3 à jouer')
                .setRequired(true)),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment('file');

        if (!attachment.contentType.startsWith('audio/mpeg')) {
            return interaction.reply({ content: 'Veuillez télécharger un fichier MP3 valide.', ephemeral: true });
        }

        // Vérifier si l'utilisateur est dans un salon vocal
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'Vous devez être dans un salon vocal pour utiliser cette commande.', ephemeral: true });
        }

        // Télécharger le fichier MP3
        const response = await axios({
            url: attachment.url,
            method: 'GET',
            responseType: 'stream',
        });

        const filePath = path.join(__dirname, '..', '..', 'music', `${attachment.name}`);
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Rejoindre le salon vocal
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        // Créer un lecteur audio
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        // Créer une ressource audio à partir du fichier MP3
        const resource = createAudioResource(filePath);

        // Jouer le fichier audio
        player.play(resource);
        connection.subscribe(player);

        await interaction.reply({ content: `Joue le fichier : ${attachment.name}`, ephemeral: true });

        // Quitter le salon vocal après la lecture
        player.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle') {
                connection.destroy();
                fs.unlinkSync(filePath); // Supprimer le fichier après lecture
            }
        });
    },
};
