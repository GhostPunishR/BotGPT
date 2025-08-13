const fs = require('fs');
require('dotenv/config');
const { Client, GatewayIntentBits } = require('discord.js');
const { OpenAI } = require('openai');

// ==== Vérification ENV ====
if (!process.env.OPENAI_KEY || !process.env.TOKEN || !process.env.CHANNEL_ID) {
    console.error("Clé API OpenAI, Token Discord ou CHANNEL_ID manquant !");
    process.exit(1);
}

// ==== Config ====
const IGNORE_PREFIX = "!";
const CHANNEL_ID = process.env.CHANNEL_ID;
const MEMORY_FILE = 'memory.json';
const MESSAGE_LIMIT = 20;
const INACTIVITY_LIMIT_DAYS = 30;
const ANTI_SPAM_MS = 3000;
const SAVE_INTERVAL_MS = 10000;

// ==== Initialisation ====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

let userConversations = {};
const lastMessageTime = {};
let memoryDirty = false; // flag pour éviter de sauvegarder trop souvent

// ==== Chargement mémoire ====
if (fs.existsSync(MEMORY_FILE)) {
    try {
        userConversations = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
    } catch (err) {
        console.error("Erreur de lecture mémoire :", err);
    }
}

function saveMemory(force = false) {
    if (!memoryDirty && !force) return;
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(userConversations, null, 2));
    memoryDirty = false;
}

function purgeOldMemory() {
    const now = Date.now();
    for (let userId in userConversations) {
        if (now - (userConversations[userId].lastInteraction || now) > INACTIVITY_LIMIT_DAYS * 86400000) {
            delete userConversations[userId];
        } else if (userConversations[userId].history.length > MESSAGE_LIMIT) {
            userConversations[userId].history.splice(
                1,
                userConversations[userId].history.length - MESSAGE_LIMIT
            );
        }
    }
    memoryDirty = true;
}
purgeOldMemory();

// Sauvegarde régulière
setInterval(() => saveMemory(), SAVE_INTERVAL_MS);

// ==== Bot prêt ====
client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// ==== Messages ====
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channelId !== CHANNEL_ID) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;

    // Anti-spam
    if (lastMessageTime[message.author.id] && Date.now() - lastMessageTime[message.author.id] < ANTI_SPAM_MS) {
        return;
    }
    lastMessageTime[message.author.id] = Date.now();

    // ==== Modération OpenAI (désactivée temporairement) ====
    /*
    try {
        const moderationResponse = await openai.moderations.create({
            input: message.content,
        });

        if (moderationResponse.results[0].flagged) {
            await message.reply("Désolé, je ne peux pas traiter cette demande.");
            return;
        }
    } catch (error) {
        console.error("Erreur lors de la modération :", error.message);
        await message.reply("Problème avec la modération, réessaie plus tard.");
        return;
    }
    */

    await message.channel.sendTyping();
    const typingInterval = setInterval(() => message.channel.sendTyping(), 5000);

    // Initialiser mémoire utilisateur
    if (!userConversations[message.author.id]) {
        userConversations[message.author.id] = {
            history: [{ role: 'system', content: 'OrionAI est un chatbot amical et serviable.' }],
            lastInteraction: Date.now()
        };
    }

    // Ajouter message utilisateur
    userConversations[message.author.id].history.push({ role: 'user', content: message.content });
    userConversations[message.author.id].lastInteraction = Date.now();
    memoryDirty = true;

    // Limiter historique
    if (userConversations[message.author.id].history.length > MESSAGE_LIMIT) {
        userConversations[message.author.id].history.splice(1, userConversations[message.author.id].history.length - MESSAGE_LIMIT);
    }

    // ==== Requête OpenAI ====
    let botReply = "";
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: userConversations[message.author.id].history,
        });

        botReply = response?.choices?.[0]?.message?.content || "Pas de réponse.";
    } catch (error) {
        console.error("Erreur API OpenAI :", error.message);
        botReply = "Problème avec l'IA, réessaie plus tard.";
    } finally {
        clearInterval(typingInterval);
    }

    // Ajouter réponse bot à l'historique
    userConversations[message.author.id].history.push({ role: 'assistant', content: botReply });
    memoryDirty = true;

    // Découpage si > 2000 caractères
    const chunkSize = 2000;
    for (let i = 0; i < botReply.length; i += chunkSize) {
        await message.reply(botReply.substring(i, i + chunkSize));
    }
});

client.login(process.env.TOKEN);
