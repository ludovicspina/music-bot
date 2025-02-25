const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Charge les variables d'environnement depuis .env

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gemini')
        .setDescription('Pose une question à Gemini')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('La question que tu veux poser à Gemini')
                .setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');

        await interaction.deferReply(); // Permet au bot de prendre du temps pour répondre

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(question);
            const response = result.response.text();

            // Affiche la question avant la réponse
            await interaction.editReply(`**Question :** ${question}`);

            // Diviser la réponse en segments de 2000 caractères
            const messages = response.match(/[\s\S]{1,2000}/g);

            for (const msg of messages) {
                await interaction.followUp(msg);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply("Une erreur est survenue lors de la requête à l'API Gemini.");
        }
    },
};
