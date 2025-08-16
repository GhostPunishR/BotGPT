/**
 * Bot Discord + OpenAI — Exemple public
 * --------------------------------------
 * Objectif : montrer un bot minimal qui répond avec l'API OpenAI,
 * avec un peu de mémoire locale et de gardes-fous simples.
 *
 * Comment l'utiliser :
 *   1) Node 18+ recommandé.
 *   2) `npm i discord.js openai dotenv`
 *   3) Copier `.env.example` -> `.env` et remplir :
 *        TOKEN=...          (token de ton application Discord)
 *        OPENAI_KEY=...     (clé API OpenAI)
 *        ALLOW_CHANNELS=123456789012345678,987654321098765432  (optionnel)
 *        MODEL=gpt-4o-mini  (ou autre modèle compatible)
 *   4) `node bot.js`
 *
 * Notes importantes :
 *   - Ne JAMAIS committer `.env` sur un repo public.
 *   - `ALLOW_CHANNELS` permet de restreindre les salons où le bot répond.
 *   - Ce code utilise un fichier JSON local pour "mémoriser" le dernier échange.
 *     C'est suffisant pour un exemple. Pour la production, préférer une base durable.
 */

const fs = require('fs');
require('dotenv/config'); // charge automatiquement les variables depuis .env
const { Client, GatewayIntentBits } = require('discord.js');
const { OpenAI } = require('openai');

// =======================
// 1) Vérification basique des variables d'environnement
// =======================
if (!process.env.OPENAI_KEY || !process.env.TOKEN) {
  console.error("❌ Il manque OPENAI_KEY ou TOKEN dans ton .env");
  process.exit(1);
}

// Liste de salons autorisés (optionnel). Si vide => le bot répond partout.
const ALLOW_CHANNELS = (process.env.ALLOW_CHANNELS || process.env.CHANNEL_ID || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// =======================
// 2) Petites options de configuration (modifiables via .env)
// =======================
const MEMORY_FILE = 'memory.json';                           // stockage local des historiques
const MESSAGE_LIMIT = parseInt(process.env.MESSAGE_LIMIT || '20', 10); // nb max de tours gardés
const ANTI_SPAM_MS = parseInt(process.env.ANTI_SPAM_MS || '3000', 10); // cooldown anti-spam (ms)
const MODEL = process.env.MODEL || 'gpt-4o-mini';            // modèle OpenAI configurable
const TEMPERATURE = parseFloat(process.env.TEMPERATURE || '0.7'); // créativité des réponses
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '500', 10); // taille max de sortie

// =======================
// 3) Initialisation Discord et OpenAI
// =======================
const client = new Client({
  intents: [
    // Intents nécessaires pour lire les messages et y répondre
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// =======================
// 4) Mémoire simple (par utilisateur) dans un fichier JSON
// =======================
// Structure : { [userId]: { history: [{role, content}, ...], lastInteraction: number } }
let userConversations = {};
if (fs.existsSync(MEMORY_FILE)) {
  try {
    userConversations = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
  } catch {
    console.warn("⚠️ Impossible de lire la mémoire, on repart de zéro.");
    userConversations = {};
  }
}
let memoryDirty = false;

// Sauvegarde synchrone (suffisant pour un exemple). Pour un vrai projet : asynchrone + atomique.
function saveMemory(force = false) {
  if (!memoryDirty && !force) return;
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(userConversations, null, 2));
    memoryDirty = false;
  } catch (e) {
    console.error("❌ Erreur de sauvegarde mémoire :", e);
  }
}

// Sauvegarde à la fermeture (Ctrl+C)
process.on('SIGINT', () => { 
  console.log("\n🛑 Arrêt demandé — sauvegarde de la mémoire...");
  saveMemory(true); 
  process.exit(0); 
});

// =======================
// 5) Aides : anti-spam & découpe de messages
// =======================
// Discord limite un message à 2000 caractères. On découpe proprement les textes longs.
function splitForDiscord(text) {
  const CHUNK = 1900; // marge de sécurité si on a des blocs de code
  const out = [];
  let buf = '';
  for (const line of String(text).split('\n')) {
    if ((buf + '\n' + line).length > CHUNK) {
      out.push(buf);
      buf = line;
    } else {
      buf = buf ? buf + '\n' + line : line;
    }
  }
  if (buf) out.push(buf);
  return out;
}

// Anti-spam minimal : impose un délai minimum entre deux messages d'un même utilisateur
const lastMessageTime = {};
function isAllowedChannel(channelId) {
  // Si ALLOW_CHANNELS est vide, on autorise tous les salons
  return ALLOW_CHANNELS.length === 0 || ALLOW_CHANNELS.includes(channelId);
}

// =======================
// 6) Ready : simple log pour confirmer la connexion
// =======================
client.on('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// =======================
// 7) Écoute des messages
// =======================
client.on('messageCreate', async (message) => {
  // a) Ignorer les messages des bots (y compris ce bot)
  if (message.author.bot) return;

  // b) Restreindre aux salons autorisés (si tu en as listé)
  if (!isAllowedChannel(message.channelId)) return;

  // c) Anti-spam : si l'utilisateur envoie trop vite, on ignore
  const now = Date.now();
  const last = lastMessageTime[message.author.id] || 0;
  if (now - last < ANTI_SPAM_MS) return;
  lastMessageTime[message.author.id] = now;

  // d) Indiquer à Discord que le bot "écrit" (UX sympa)
  await message.channel.sendTyping();

  // e) Initialiser la mémoire de cet utilisateur si besoin
  const uid = message.author.id;
  if (!userConversations[uid]) {
    userConversations[uid] = {
      // Le message "system" sert à donner une personnalité/mission au modèle
      history: [{ role: 'system', content: 'BotGPT est un chatbot amical et serviable.' }],
      lastInteraction: Date.now()
    };
  }

  // f) Ajouter le message utilisateur à l'historique
  userConversations[uid].history.push({ role: 'user', content: message.content });
  userConversations[uid].lastInteraction = Date.now();

  // g) Limiter la taille de l'historique (évite les coûts et les prompts trop longs)
  if (userConversations[uid].history.length > MESSAGE_LIMIT) {
    // on garde l'entrée "system" en tête, et on coupe le surplus
    userConversations[uid].history.splice(1, userConversations[uid].history.length - MESSAGE_LIMIT);
  }
  memoryDirty = true;

  // h) Appeler l'API OpenAI pour générer la réponse
  let botReply = "Désolé, je n'ai pas de réponse pour le moment.";
  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,                               // modèle configurable (via .env)
      messages: userConversations[uid].history,   // historique minimal de la conversation
      temperature: TEMPERATURE,                   // plus haut = plus créatif
      max_tokens: MAX_TOKENS                      // limite la longueur de la réponse
    });

    botReply = resp?.choices?.[0]?.message?.content?.trim() || botReply;
  } catch (e) {
    // En cas d'erreur API (clé invalide, quota, réseau...), on log + message gentil
    console.error("❌ OpenAI error:", e?.message || e);
    botReply = "Oups, un souci côté IA. Réessaie un peu plus tard.";
  }

  // i) Mémoriser la réponse de l'assistant
  userConversations[uid].history.push({ role: 'assistant', content: botReply });
  memoryDirty = true;

  // j) Sauvegarder la mémoire sur disque (simple et suffisant pour un exemple)
  saveMemory();

  // k) Répondre en "chunks" si le message dépasse 2000 caractères
  for (const chunk of splitForDiscord(botReply)) {
    await message.reply({
      content: chunk,
      // Astuce UX : ne pas "ping" l'utilisateur quand on répond
      allowedMentions: { repliedUser: false }
    });
  }
});

// =======================
// 8) Connexion du bot à Discord
// =======================
client.login(process.env.TOKEN);
