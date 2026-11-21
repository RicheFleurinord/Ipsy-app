export type Level = "vert" | "orange" | "rouge";

const ORDER: Record<Level, number> = { vert: 0, orange: 1, rouge: 2 };

export function maxLevel(a: Level, b: Level): Level {
  return ORDER[a] >= ORDER[b] ? a : b;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Filet de sécurité par mots-clés (FR + kreyòl), appliqué AVANT l'appel IA.
 * Il ne fait qu'élever le niveau de prudence de l'interface ; il ne remplace
 * pas le jugement du modèle et ne produit aucune réponse à sa place.
 */
const ROUGE = [
  // Français
  /suicid/, /me (tuer|suicider)/, /en finir/, /mettre fin a (ma|mes) (vie|jours)/, /(envie|veux|vais) (de )?mourir/,
  /me faire du mal/, /me couper/, /plus envie de vivre/, /(tuer|blesser) quelqu un/,
  /(on|ils) (me|nous) (menace|tire|attaque|frappe)/, /(des |les )?tirs? (tout )?pres/, /coups de feu/, /je suis en danger/,
  /(il|elle|on) va me tuer/, /kidnapp/,
  // Kreyòl
  /touye tet (mwen|m)/, /m (vle|ap) touye tet/, /(mwen|m) vle mouri/, /fini ak (lavi|vi) (mwen|m)/, /(mwen|m) pa vle viv/,
  /fe tet (mwen|m) mal/, /yo (vle|pral|ap) touye (mwen|m|nou)/, /yo ap tire/, /tire (toupre|bo|nan katye)/, /bal ap tonbe/,
  /(mwen|m) an danje/, /kidnape/, /bandi (yo )?(antre|la|ap)/, /yo (menase|bat) (mwen|m)/,
];

const ORANGE = [
  // Français
  /desespoir/, /desespere/, /je n en peux plus/, /plus la force/, /un fardeau/, /personne ne (m aime|me comprend)/,
  /tout seul|toute seule|seul\(e\)/, /a quoi bon/, /plus d espoir/, /idees noires/, /je craque/, /je ne dors plus/,
  /panique/, /trauma/, /violee?|agression/,
  // Kreyòl
  /\b(mwen|m) pa ka anko/, /(mwen|m) bouke ak lavi/, /pa gen espwa/, /(mwen|m) poukont (mwen|m)/,
  /pesonn pa (renmen|konprann)/, /(mwen|m) dekouraje/, /tet (mwen|m) chaje/, /(mwen|m) pe anpil/, /(mwen|m) pa ka dom/,
];

export function keywordLevel(text: string): Level {
  const n = normalize(text);
  if (ROUGE.some((r) => r.test(n))) return "rouge";
  if (ORANGE.some((r) => r.test(n))) return "orange";
  return "vert";
}

export function parseLevelTag(s: string): Level | null {
  const m = s.match(/\[\[\s*(vert|orange|rouge)\s*\]\]/i);
  return m ? (m[1].toLowerCase() as Level) : null;
}
