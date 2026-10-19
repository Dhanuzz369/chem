/** Phrases that would make an invented claim (certifications, track record, compliance, guarantees). */
export const bannedClaims = /certified|ISO \d|since \d{4}|years of experience|REACH[- ]compliant|guarantee/i;

/** Page copy also avoids marketing superlatives that imply a track record. */
export const bannedPageClaims = new RegExp(`${bannedClaims.source}|leading|trusted|premier`, "i");
