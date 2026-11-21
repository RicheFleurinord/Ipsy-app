/**
 * Annuaire des ressources d'aide.
 *
 * RÈGLE : n'ajouter une ressource que si son existence, sa zone couverte et ses
 * coordonnées ont été vérifiées auprès d'une source officielle, avec la date de
 * vérification. Aucune ressource supposée ou inventée. Tant que la liste est vide,
 * l'interface affiche un message transparent.
 */
export type Resource = {
  name: string;
  type: { fr: string; ht: string };
  zone: string;
  contact: string; // numéro ou adresse vérifiés
  languages: string[];
  source: string; // URL ou référence de la source officielle
  verifiedOn: string; // AAAA-MM-JJ
};

export const verifiedResources: Resource[] = [];
