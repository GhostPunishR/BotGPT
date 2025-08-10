### Discord ChatGPT-like Bot

Bot Discord interactif utilisant l’API OpenAI (GPT-3.5-turbo ou supérieur à votre choix) pour converser avec chaque utilisateur de manière personnalisée.  
Le bot garde une mémoire locale des conversations (par utilisateur) dans un fichier JSON, pour des échanges plus naturels et continus.

---

## Fonctionnalités

- Conversations séparées par utilisateur avec contexte sauvegardé  
- Mémoire persistante sur disque (`memory.json`)  
- Support de plusieurs salons (configurable)  
- Protection contre les commandes préfixées (`!`)  
- Découpage automatique des réponses longues  
- Facile à configurer via fichier `.env`

---

## Installation

- [VisualStudioCode](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/fr)
- npm init -y
- npm install discord.js dotenv openai

Récupérer les fichiers (.env, index.js, memory.json) et le mettre dans votre dossier structuré.

---

## Configuration

- Modifie la constante <code style="color : green">'CHANNEL_ID1, CHANNEL_ID2'</code> dans 'index.js' pour définir le salon où le bot répond.
- Modifie la constante du <code style="color : green">model: 'gpt-3.5-turbo'</code> dans 'index.js' et mettre votre version souhaitée.
- Modifie la constante <code style="color : green">"CHANNEL_ID1, CHANNEL_ID2"</code> dans 'memory.json' pour définir le salon du bot
- Ajoute ton <code style="color : green">TOKEN DISCORD</code> et ta <code style="color : green">CLEF API OPENAI</code> dans '.env'
- Change le préfixe dans <code style="color : green">'IGNORE_PREFIX'</code> si besoin.

---

## Licence
Ce projet est sous licence Apache License 2.0.
Voir le fichier [LICENSE](https://github.com/GhostPunishR/BotGPT/blob/main/LICENSE) pour plus de détails.

---

## Soutien
[![Faire un don via PayPal](https://img.shields.io/badge/PayPal-Faire_un_don-00457C?style=for-the-badge&logo=paypal)](https://www.paypal.me/MrUrbain)
