import { ASK_FIRST_ZONES } from "./consent-zones.generated";

/**
 * Countries where Google Analytics waits for the visitor's Accept: Europe (GDPR and the ePrivacy
 * rules on cookies) plus every country where one of the GoodBiz group's site languages is spoken
 * (Arabic, French, Spanish, Portuguese, Russian, Chinese, German, Turkish, Indonesian, Swahili,
 * Vietnamese), most of which also have consent-based privacy laws. Everywhere else, India and the
 * USA included, analytics runs by default with an opt-out in Cookie settings.
 * Same list as goodbizhygiene.com. After changing it, run `npm run consent-zones`.
 */
export const CONSENT_REGIONS = "AE AO AR AT BE BF BG BH BI BJ BL BO BR BY CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DO DZ EC EE EG ES FI FR GA GB GF GN GP GQ GR GT GW HK HN HR HT HU ID IE IQ IS IT JO KE KG KM KW KZ LB LI LT LU LV LY MA MC MF MG ML MO MQ MR MT MX MZ NC NE NI NL NO OM PA PE PF PL PM PR PS PT PY QA RE RO RU RW SA SC SD SE SG SI SK SN SO ST SV SY TD TG TL TN TR TW TZ UG UY VE VN VU WF YE YT".split(" ");

const zones = new Set<string>(ASK_FIRST_ZONES);

/** Whether a browser time zone means "ask before analytics". No zone at all is treated as Europe. */
export function asksFirst(timeZone: string | undefined): boolean {
  return !timeZone || timeZone.startsWith("Europe/") || zones.has(timeZone);
}
