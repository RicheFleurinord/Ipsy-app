# IPsy — Écouter. Comprendre. Soutenir.

Plateforme web haïtienne de soutien émotionnel par intelligence artificielle, en **français** et en **kreyòl ayisyen**.
MVP réalisé par **IMPACTIS Group** pour l'**Ayiti AI Hackathon 2026**.

> IPsy est un outil de soutien et d'orientation. Il ne remplace ni un professionnel de santé mentale, ni un médecin, ni les services d'urgence.

## Stack

| Partie | Choix |
|---|---|
| Interface | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 |
| IA | Route serveur `app/api/chat/route.ts` → Google Gemini API (principal) ou Groq (secours), en streaming |
| Données | Aucune base de données. Conversation en mémoire de session ; journal et humeurs en `localStorage` (démo) |
| Hébergement | Vercel Hobby (gratuit) · GitHub |

## Installation locale

```bash
npm install
cp .env.example .env.local   # puis renseigner au moins une clé (GEMINI_API_KEY ou GROQ_API_KEY)
npm run dev                  # http://localhost:3000
```

Clés gratuites :
- Gemini : https://aistudio.google.com/apikey
- Groq : https://console.groq.com/keys

Les limites gratuites changent souvent : vérifiez-les dans la console du fournisseur avant la démo.
**Données :** sur l'offre gratuite de Gemini, Google peut utiliser les contenus pour améliorer ses produits. Groq applique ses propres conditions. D'où la règle de la démo : **exemples fictifs uniquement**.

## Déploiement (gratuit)

1. Pousser le dépôt sur GitHub.
2. Sur https://vercel.com → *Add New → Project* → importer le dépôt (framework détecté automatiquement).
3. *Environment Variables* : ajouter `AI_PROVIDER`, `GEMINI_API_KEY` et, si possible, `GROQ_API_KEY` (secours).
4. *Deploy*.
5. Sous-domaine : *Settings → Domains* → ajouter `ipsy.impactisgroup.org`, puis créer chez le gestionnaire DNS de `impactisgroup.org` l'enregistrement **CNAME** `ipsy` vers la valeur indiquée par Vercel.

## Architecture

```
app/
  page.tsx              Accueil (mission, langue, pensée du jour, limites)
  discuter/ChatView.tsx Chat IA + avatar à états + cartes de sécurité
  api/chat/route.ts     Appel IA serveur : validation, limite de fréquence, streaming, niveau de vigilance
  aide/                 Page « Besoin d'aide maintenant ? » + simulation de crise
  journal/ evolution/ bien-etre/ profil/
lib/
  ai/system-prompt.ts   Prompt IPsy (identité, langue, interdits, protocole rouge)
  ai/provider.ts        Gemini + Groq, bascule automatique
  ai/safety.ts          Filet de sécurité par mots-clés FR/HT (élève le niveau, ne répond jamais à la place de l'IA)
  i18n/dictionary.ts    Tous les textes FR/HT
  resources.ts          Annuaire de ressources vérifiées (vide tant que rien n'est vérifié)
public/avatar/          Avatar officiel découpé en 6 états
.claude/agents/         Agents Claude Code du projet
```

**Niveaux de vigilance.** Le modèle commence chaque réponse par `[[vert]]`, `[[orange]]` ou `[[rouge]]`. Le serveur retient le plus élevé entre ce marqueur et le filet de mots-clés, puis retire le marqueur du texte. Le niveau pilote l'avatar et les cartes de sécurité. Ce sont des **indicateurs de prudence, pas des diagnostics**.

**Avatar.** repos → écoute (saisie) → réflexion (attente) → parole (streaming) → soutien (après réponse / orange) → alerte (rouge ou erreur).

## Fonctionnalités et limites

| Fonction | Statut | Remarque |
|---|---|---|
| Accueil + sélecteur FR/Kreyòl partout | ✅ | Langue mémorisée sur l'appareil |
| Chat IA réel en streaming | ✅ | À tester avec une vraie clé avant la démo |
| Réponse dans la langue du message | ✅ | Défini dans le prompt ; à valider par des locuteurs haïtiens |
| Contexte de conversation | ✅ | 20 derniers messages, session uniquement |
| Nouvelle conversation / effacer / signaler | ✅ | Le signalement ne stocke qu'un compteur local |
| Avatar à 6 états synchronisés | ✅ | Images officielles + animations CSS légères |
| Bouton « Besoin d'aide maintenant ? » | ✅ | Sur toutes les pages (intégré au chat) |
| Simulation de crise | ✅ | Mention « Simulation — aucun appel réel n'est effectué » |
| Ressources d'urgence | ⚠️ Limité | **Aucun numéro publié** tant que l'équipe ne l'a pas vérifié (`lib/resources.ts`) |
| Notice limites / confidentialité avant le chat | ✅ | FR + HT |
| Pensée du jour | ✅ | 10 pensées FR/HT |
| Journal (créer, modifier, supprimer, humeur) | ✅ | Local, jamais envoyé à l'IA |
| Mon évolution (7 / 30 jours) | ✅ | Données fictives clairement signalées |
| Respiration, ancrage, pause | ✅ | Présentés comme outils de bien-être |
| Mode sombre | ✅ | Facultatif |
| Erreurs (réseau, quota, clé manquante, panne) | ✅ | Messages clairs, jamais de fausse réponse IA |
| Voix (dictée / lecture) | ❌ | P2, non développé |
| Comptes, mémoire entre sessions | ❌ | P2, non développé |

## Sécurité

- Clés API uniquement côté serveur (`process.env`). `.env*` ignoré par Git.
- Aucun contenu de conversation n'est journalisé : les logs serveur ne contiennent que des codes d'erreur.
- Limite de 15 requêtes/minute par IP, messages limités à 2000 caractères.
- Le prompt interdit : diagnostic, prescription, promesse de guérison, questions sur les détails d'un traumatisme, numéros inventés, affirmation d'avoir contacté les secours.
- Avant tout lancement public : relecture des textes créoles et des scénarios de crise par des professionnels et des locuteurs haïtiens, vérification datée des ressources, revue des conditions des fournisseurs.

## Scénario de démonstration (≈ 4 min, données fictives)

1. **Accueil** : présenter la mission, basculer en **Kreyòl** puis revenir en **Français**, montrer la pensée du jour et l'encadré des limites.
2. **Parler à IPsy** : lire la notice, cliquer « J'ai compris ».
3. **Français** : cliquer l'exemple « Je n'arrive plus à dormir à cause des tirs dans mon quartier. » Montrer l'avatar qui passe en réflexion, puis en parole, puis en soutien.
4. **Kreyòl** : taper « Mwen santi m pè anpil depi kèk jou, mwen pa konn sa pou m fè. » IPsy répond en kreyòl.
5. **Limites** : cliquer « Peux-tu me dire si j'ai une dépression et quel médicament prendre ? » IPsy refuse avec douceur et oriente vers un professionnel.
6. **Danger** : taper « Yo ap tire toupre a, m poukont mwen ak pitit mwen yo. » L'avatar passe en alerte et la carte de sécurité rouge apparaît. Ouvrir la page d'aide.
7. **Page d'aide** : étapes de sécurité, ressources vérifiées (message transparent), puis **Lancer la simulation** et « Contacter une personne de confiance ». La page indique qu'aucun appel n'est effectué.
8. **Outils** : Journal (créer une entrée fictive avec humeur), Évolution (« Charger des données fictives », 7/30 jours), Bien-être (respiration guidée).
9. **Conclusion** : architecture, coût zéro, limites assumées, prochaines étapes (voix, ressources vérifiées avec partenaires, comptes avec consentement).

## Prochaines étapes

Voix FR/HT après tests · annuaire de ressources vérifiées avec partenaires · comptes Supabase avec RLS et consentements séparés · mémoire facultative entre sessions · relecture clinique des contenus.
