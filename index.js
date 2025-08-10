const fs = require('fs');
require('dotenv/config');
const { Client, GatewayIntentBits } = require('discord.js');
const { OpenAI } = require('openai');

// ==== Vérifications des variables d'environnement ====
if (!process.env.OPENAI_KEY || !process.env.TOKEN) {
    console.error("Clé API OpenAI ou Token Discord manquant !");
    process.exit(1);
}

// ==== Initialisation du client Discord ====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['CHANNELS']; // ID des salons autorisés
const MEMORY_FILE = 'memory.json';
const MESSAGE_LIMIT = 20;
const INACTIVITY_LIMIT_DAYS = 30; // Purge après 30 jours

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

// ==== Chargement mémoire ====
let userConversations = {};
if (fs.existsSync(MEMORY_FILE)) {
    try {
        userConversations = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
    } catch (err) {
        console.error("Erreur de lecture de la mémoire:", err);
        userConversations = {};
    }
}

// ==== Sauvegarde mémoire ====
function saveMemory() {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(userConversations, null, 2));
}

// ==== Purge mémoire ancienne ====
function purgeOldMemory() {
    const now = Date.now();
    for (let userId in userConversations) {
        if (now - (userConversations[userId].lastInteraction || now) > INACTIVITY_LIMIT_DAYS * 86400000) {
            delete userConversations[userId];
        }
    }
    saveMemory();
}
purgeOldMemory();

// ==== Anti-spam ====
const lastMessageTime = {};

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    // Anti-spam : 3 sec minimum entre messages par utilisateur
    if (lastMessageTime[message.author.id] && Date.now() - lastMessageTime[message.author.id] < 3000) {
        return;
    }
    lastMessageTime[message.author.id] = Date.now();

    // Envoi typing
    await message.channel.sendTyping();
    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    // Initialiser mémoire si pas déjà
    if (!userConversations[message.author.id]) {
        userConversations[message.author.id] = {
            history: [{ role: 'system', content: 'BotGPT est un chatbot convivial.' }],
            lastInteraction: Date.now()
        };
    }

    // Ajouter message user
    userConversations[message.author.id].history.push({
        role: 'user',
        content: message.content
    });
    userConversations[message.author.id].lastInteraction = Date.now();

    // Limiter taille historique
    if (userConversations[message.author.id].history.length > MESSAGE_LIMIT) {
        userConversations[message.author.id].history.splice(1, userConversations[message.author.id].history.length - MESSAGE_LIMIT);
    }

    // ==== Appel API OpenAI ====
    let response;
    try {
        response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: userConversations[message.author.id].history,
        });
    } catch (error) {
        console.error('Erreur OpenAI:', error);
        clearInterval(sendTypingInterval);
        return message.reply("Problème avec l'API OpenAI. Réessaie plus tard.");
    }

    clearInterval(sendTypingInterval);

    // Vérifier réponse vide
    if (!response?.choices?.length || !response.choices[0].message?.content) {
        return message.reply("Pas de réponse reçue de l'IA.");
    }

    const botReply = response.choices[0].message.content;

    // Ajouter réponse bot à l'historique
    userConversations[message.author.id].history.push({
        role: 'assistant',
        content: botReply
    });

    saveMemory();

    // Découper si > 2000 caractères
    const chunkSize = 2000;
    for (let i = 0; i < botReply.length; i += chunkSize) {
        await message.reply(botReply.substring(i, i + chunkSize));
    }
});

client.login(process.env.TOKEN);