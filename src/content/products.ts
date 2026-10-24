/**
 * Product catalogue: the single source of truth for product pages, the
 * product finder, the sitemap, llms.txt and the quote form's product list.
 *
 * Content is general chemistry about each substance. It must never describe
 * Goodbiz Chem's own grades, purity, volumes or regulatory status.
 */

import { site } from "@/config/site";

export type ProductGroup = "Solvents" | "Amines" | "Inorganics" | "Surfactants";

export interface Faq {
  q: string;
  a: string;
}

export interface Product {
  slug: string;
  name: string;
  /**
   * Page title (before " | Goodbiz Chem") for names too long for the generated
   * "<Name> Exporter & Supplier, HSN <code>" pattern. Keep it at most 45 characters.
   */
  seoTitle?: string;
  /** Shown exactly as given by the owner; some codes are 6 digits, some 8. */
  hsn: string;
  group: ProductGroup;
  cas: string[];
  synonyms: string[];
  summary: string;
  /** A short clause for search-result snippets: "<Name> (HSN <code>) — <metaSummary>. Exporter from <country>. SDS available on request." */
  metaSummary: string;
  applications: string[];
  industries: string[];
  form: string;
  packaging: string[];
  handling: string[];
  hazards: string[];
  faqs: Faq[];
  related: string[];
  notes?: string[];
}

export const productGroups: ProductGroup[] = ["Solvents", "Amines", "Inorganics", "Surfactants"];

export const products: Product[] = [
  // ───────────────────────────── Solvents ─────────────────────────────
  {
    slug: "ethyl-acetate",
    name: "Ethyl Acetate",
    hsn: "29153100",
    group: "Solvents",
    cas: ["141-78-6"],
    synonyms: ["Ethyl ethanoate", "Acetic acid ethyl ester", "EtOAc", "EA"],
    summary:
      "Ethyl acetate is a fast-evaporating ester solvent with a mild, fruity odour. It dissolves nitrocellulose, many resins and printing-ink binders, which makes it a staple in flexible packaging inks, adhesives, coatings and pharmaceutical extraction.",
    metaSummary: "a fast-evaporating ester solvent for inks, adhesives, coatings and extraction",
    applications: [
      "Solvent for flexographic and gravure printing inks",
      "Adhesives and laminating adhesives for flexible packaging",
      "Nitrocellulose lacquers, wood coatings and nail-polish formulations",
      "Extraction and crystallisation solvent in pharmaceutical and API processing",
      "Decaffeination of coffee and tea, and flavour extraction",
    ],
    industries: ["Printing and packaging", "Adhesives", "Paints and coatings", "Pharmaceuticals", "Food processing", "Cosmetics"],
    form: "Clear, colourless, mobile liquid with a sweet, fruity odour. Boils at about 77 °C and is partly soluble in water.",
    packaging: ["Steel or HDPE drums", "IBC totes", "ISO tank containers", "Road tankers"],
    handling: [
      "Store in a cool, well-ventilated area away from heat, sparks and open flames.",
      "Earth and bond containers during transfer; the liquid can build up static charge.",
      "Keep containers tightly closed to limit evaporation and moisture pick-up, which slowly hydrolyses the ester to acetic acid and ethanol.",
      "Keep apart from strong oxidisers, strong acids and strong bases.",
    ],
    hazards: [
      "Highly flammable liquid and vapour; the flash point is well below room temperature (about −4 °C).",
      "Causes serious eye irritation.",
      "Vapour may cause drowsiness or dizziness in poorly ventilated spaces.",
    ],
    faqs: [
      {
        q: "What is ethyl acetate mainly used for?",
        a: "Mostly as a solvent for printing inks, adhesives and coatings. It is also used in pharmaceutical extraction, nail-polish removers and natural decaffeination of coffee and tea.",
      },
      {
        q: "Is ethyl acetate the same as acetone?",
        a: "No. Acetone is a ketone; ethyl acetate is an ester. Both evaporate quickly, but ethyl acetate has a fruity odour, lower water solubility and different solvency for resins, so they are not always interchangeable.",
      },
      {
        q: "What HSN code covers ethyl acetate?",
        a: "Ethyl acetate falls under HSN 29153100, the heading for ethyl acetate within esters of acetic acid.",
      },
      {
        q: "Does ethyl acetate break down in storage?",
        a: "Slowly, if water gets in. Moisture hydrolyses it to acetic acid and ethanol, which raises acidity, so keep drums sealed and dry.",
      },
      {
        q: "Is an SDS available for ethyl acetate?",
        a: "Yes. An SDS is available on request; ask for it with your quote.",
      },
    ],
    related: ["isopropyl-alcohol", "toluene", "methanol"],
  },
  {
    slug: "methanol",
    name: "Methanol",
    hsn: "29051100",
    group: "Solvents",
    cas: ["67-56-1"],
    synonyms: ["Methyl alcohol", "Wood alcohol", "Carbinol", "MeOH"],
    summary:
      "Methanol is the simplest alcohol and one of the most traded basic chemicals. It is a feedstock for formaldehyde, acetic acid and MTBE, a fuel and biodiesel ingredient, and a polar solvent. It is toxic as well as flammable, so handling discipline matters.",
    metaSummary: "the simplest alcohol: a feedstock for formaldehyde and acetic acid, a fuel and solvent",
    applications: [
      "Feedstock for formaldehyde, acetic acid, MTBE and methylamines",
      "Transesterification reagent in biodiesel production",
      "Solvent in pharmaceutical synthesis and for resins, dyes and inks",
      "Antifreeze and windshield-washer fluids",
      "Denaturant for industrial ethanol",
    ],
    industries: ["Petrochemicals", "Resins and plywood", "Biofuels", "Pharmaceuticals", "Paints and inks", "Automotive fluids"],
    form: "Clear, colourless liquid with a faint alcohol odour. Boils at about 65 °C and mixes fully with water.",
    packaging: ["Steel or HDPE drums", "IBC totes", "ISO tank containers", "Road tankers"],
    handling: [
      "Store in tightly closed containers in a cool, ventilated area away from ignition sources.",
      "Earth and bond equipment during transfer and use spark-free tools.",
      "Keep segregated from oxidisers, and label clearly so it can never be mistaken for drinking alcohol or ethanol.",
      "Methanol burns with a nearly invisible flame in daylight; keep suitable extinguishers and heat detection in mind.",
    ],
    hazards: [
      "Highly flammable liquid and vapour (flash point about 11 °C).",
      "Toxic if swallowed, inhaled or absorbed through the skin.",
      "Causes damage to organs, notably the optic nerve; small amounts swallowed can cause blindness or death.",
    ],
    faqs: [
      {
        q: "Why is methanol toxic when ethanol is not to the same degree?",
        a: "Because the body metabolises methanol to formaldehyde and formic acid, which damage the optic nerve and cause acidosis. That is why even small ingested amounts are dangerous.",
      },
      {
        q: "What is methanol used for in industry?",
        a: "Mainly as a building block for formaldehyde, acetic acid and MTBE, and in biodiesel. It is also a common solvent, antifreeze and ethanol denaturant.",
      },
      {
        q: "What HSN code does methanol use?",
        a: "Methanol (methyl alcohol) is classified under HSN 29051100.",
      },
      {
        q: "Can methanol be stored in plastic drums?",
        a: "Yes, HDPE drums and IBCs are commonly used, as are carbon-steel and stainless-steel containers. Avoid aluminium at elevated temperature and keep everything earthed.",
      },
      {
        q: "Is an SDS available for methanol?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["isopropyl-alcohol", "ethyl-acetate", "toluene"],
  },
  {
    slug: "isopropyl-alcohol",
    name: "IPA (Isopropyl Alcohol)",
    seoTitle: "Isopropyl Alcohol IPA Exporter, HSN 29051220",
    hsn: "29051220",
    group: "Solvents",
    cas: ["67-63-0"],
    synonyms: ["Isopropanol", "2-Propanol", "Propan-2-ol", "IPA", "Rubbing alcohol", "Dimethyl carbinol"],
    summary:
      "Isopropyl alcohol (IPA) is a water-miscible solvent that evaporates cleanly without residue. It is widely used for disinfectants and hand sanitisers, electronics cleaning, pharmaceutical processing, and as a solvent for inks, coatings and cosmetics.",
    metaSummary: "a water-miscible solvent for disinfectants, cleaning, inks and coatings",
    applications: [
      "Disinfectants, surface sanitisers and hand-rub formulations",
      "Precision cleaning of electronics, PCBs and optics",
      "Process and extraction solvent in pharmaceutical manufacturing",
      "Solvent for printing inks, coatings and thinners",
      "Carrier in cosmetics, personal-care and fragrance products",
    ],
    industries: ["Healthcare and hygiene", "Electronics", "Pharmaceuticals", "Printing inks", "Cosmetics", "Paints and coatings"],
    form: "Clear, colourless liquid with a sharp alcohol odour. Boils at about 82 °C and mixes fully with water.",
    packaging: ["Steel or HDPE drums", "IBC totes", "ISO tank containers", "Road tankers"],
    handling: [
      "Store in closed containers in a cool, ventilated place away from heat and ignition sources.",
      "Earth and bond equipment during transfer.",
      "Keep apart from strong oxidisers and acids.",
      "IPA can form peroxides on very long storage exposed to air and light; keep containers closed and rotate stock.",
    ],
    hazards: [
      "Highly flammable liquid and vapour (flash point about 12 °C).",
      "Causes serious eye irritation.",
      "Vapour may cause drowsiness or dizziness.",
    ],
    faqs: [
      {
        q: "Is IPA the same as rubbing alcohol?",
        a: "Largely, yes. Rubbing alcohol is usually isopropyl alcohol diluted with water, commonly around 70%. Industrial IPA is supplied far more concentrated.",
      },
      {
        q: "Why is 70% IPA used for disinfection rather than pure IPA?",
        a: "Because the water slows evaporation and helps the alcohol penetrate and denature microbial proteins. Near-anhydrous IPA evaporates too quickly to be as effective on surfaces.",
      },
      {
        q: "Is IPA safe to use on electronics?",
        a: "Yes, high-concentration IPA is a standard electronics cleaner because it dissolves flux and oils and dries without residue. Power off equipment and let it dry fully first, since IPA is flammable.",
      },
      {
        q: "What HSN code does isopropyl alcohol use?",
        a: "Isopropyl alcohol is classified under HSN 29051220.",
      },
      {
        q: "Is an SDS available for IPA?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["methanol", "ethyl-acetate", "methylene-chloride"],
  },
  {
    slug: "methylene-chloride",
    name: "DCM / Methylene Chloride",
    seoTitle: "Methylene Chloride DCM Exporter, HSN 29031200",
    hsn: "29031200",
    group: "Solvents",
    cas: ["75-09-2"],
    synonyms: ["Dichloromethane", "Methylene chloride", "Methylene dichloride", "DCM", "R-30"],
    summary:
      "Dichloromethane (DCM, methylene chloride) is a dense, very volatile chlorinated solvent that is not flammable under normal conditions. It is used for pharmaceutical extraction, polycarbonate production, adhesives and metal cleaning, and needs strong vapour control.",
    metaSummary: "a chlorinated solvent for pharma extraction, adhesives and cleaning",
    applications: [
      "Extraction and reaction solvent in pharmaceutical and fine-chemical synthesis",
      "Process solvent in polycarbonate and cellulose triacetate film production",
      "Industrial adhesives and solvent welding of plastics",
      "Metal degreasing and parts cleaning",
      "Blowing agent for some polyurethane foams",
    ],
    industries: ["Pharmaceuticals", "Polymers and plastics", "Adhesives", "Metal finishing", "Fine chemicals"],
    form: "Clear, colourless, heavy liquid with a sweet, chloroform-like odour. Boils at about 40 °C and is about 1.3 times as dense as water.",
    packaging: ["Steel drums (often lacquer-lined)", "IBC totes suited to chlorinated solvents", "ISO tank containers"],
    handling: [
      "Use only with good local exhaust ventilation; vapour is heavier than air and collects in pits, tanks and low areas.",
      "Store in closed, stabilised containers in a cool place, out of direct sun; its low boiling point means drums can pressurise in heat.",
      "Keep away from aluminium, magnesium and zinc powders, strong bases and open flames.",
      "Do not enter tanks or confined spaces that have held DCM without gas testing and suitable respiratory protection.",
    ],
    hazards: [
      "Suspected of causing cancer.",
      "Vapour can cause drowsiness, dizziness and, at high concentration, unconsciousness; the body converts DCM to carbon monoxide.",
      "Causes skin and serious eye irritation.",
      "Not flammable in normal use, but decomposes in flames or on hot surfaces to toxic gases such as hydrogen chloride and phosgene.",
    ],
    notes: [
      "Methylene chloride is subject to use restrictions in some markets, for example for consumer paint strippers in the EU and for many uses in the United States. Buyers should check the rules that apply in their market and application.",
    ],
    faqs: [
      {
        q: "Is DCM flammable?",
        a: "Not under normal conditions; it has no conventional flash point. It can still form ignitable mixtures at high vapour concentrations with strong ignition sources, and it produces toxic gases when it burns or meets hot surfaces.",
      },
      {
        q: "Why is DCM popular for extraction?",
        a: "Because it dissolves a wide range of organic compounds, does not mix with water, and boils at about 40 °C, so it is easy to separate and remove at low temperature.",
      },
      {
        q: "Are DCM and methylene chloride the same chemical?",
        a: "Yes. Dichloromethane, methylene chloride, methylene dichloride and DCM are all names for CH₂Cl₂, CAS 75-09-2.",
      },
      {
        q: "What HSN code covers methylene chloride?",
        a: "Dichloromethane is classified under HSN 29031200.",
      },
      {
        q: "Is an SDS available for DCM?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["toluene", "ethyl-acetate", "n-heptane-hexane"],
  },
  {
    slug: "toluene",
    name: "Toluene",
    hsn: "29023000",
    group: "Solvents",
    cas: ["108-88-3"],
    synonyms: ["Methylbenzene", "Toluol", "Phenylmethane", "Methylbenzol"],
    summary:
      "Toluene is an aromatic hydrocarbon solvent with strong solvency for resins, rubber and paints. It is used in coatings, thinners, adhesives and inks, and as a feedstock for benzene, xylenes and toluene diisocyanate (TDI).",
    metaSummary: "an aromatic solvent for coatings, thinners, adhesives and inks, and a feedstock",
    applications: [
      "Solvent and thinner for paints, lacquers and coatings",
      "Rubber cements, contact adhesives and sealants",
      "Gravure printing inks",
      "Chemical feedstock for benzene, xylenes, TDI and benzoic acid",
      "Reaction and extraction solvent in pharmaceutical and agrochemical synthesis",
    ],
    industries: ["Paints and coatings", "Adhesives", "Printing", "Petrochemicals", "Pharmaceuticals", "Rubber"],
    form: "Clear, colourless liquid with a sweet, benzene-like odour. Boils at about 111 °C and does not mix with water.",
    packaging: ["Steel drums", "IBC totes", "ISO tank containers", "Road tankers"],
    handling: [
      "Store in closed containers in a cool, well-ventilated area away from ignition sources.",
      "Earth and bond during transfer; toluene is a static accumulator with low conductivity.",
      "Keep apart from strong oxidisers such as nitric acid and peroxides.",
      "Prevent release to drains and soil; toluene floats on water and is harmful to aquatic life.",
    ],
    hazards: [
      "Highly flammable liquid and vapour (flash point about 4 °C).",
      "May be fatal if swallowed and enters the airways (aspiration hazard).",
      "Suspected of damaging the unborn child; repeated exposure may damage organs.",
      "Causes skin irritation; vapour may cause drowsiness or dizziness.",
    ],
    faqs: [
      {
        q: "What is toluene used for?",
        a: "Mainly as a solvent in paints, thinners, adhesives and inks, and as a raw material for benzene, xylenes and TDI used in polyurethane foam.",
      },
      {
        q: "Is toluene the same as benzene?",
        a: "No. Toluene is methylbenzene, a benzene ring with a methyl group attached. It has a different toxicity profile and is the more common industrial solvent of the two.",
      },
      {
        q: "Does toluene mix with water?",
        a: "No. Toluene is practically insoluble in water and floats on it, which matters for spill control.",
      },
      {
        q: "What HSN code does toluene use?",
        a: "Toluene is classified under HSN 29023000.",
      },
      {
        q: "Is an SDS available for toluene?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["n-heptane-hexane", "ethyl-acetate", "methylene-chloride"],
  },
  {
    slug: "n-heptane-hexane",
    name: "N-Heptane and Hexane",
    hsn: "29011000",
    group: "Solvents",
    cas: ["142-82-5", "110-54-3"],
    synonyms: ["n-Heptane", "Heptane", "n-Hexane", "Hexane", "Normal heptane", "Normal hexane"],
    summary:
      "n-Heptane and n-hexane are light, non-polar alkane solvents. Hexane is the classic solvent for oilseed extraction and fast-drying adhesives; heptane is a less toxic alternative and the zero reference fuel for octane rating. Both are highly flammable.",
    metaSummary: "light alkane solvents for oilseed extraction, adhesives and laboratories",
    applications: [
      "Hexane: extraction of vegetable oils from soybean, rapeseed and other oilseeds",
      "Rubber cements, contact adhesives and tyre-repair solutions",
      "Heptane: reference fuel (zero point) for octane rating, and a replacement for hexane where lower toxicity is wanted",
      "Reaction, crystallisation and chromatography solvents in pharmaceuticals",
      "Polymerisation diluent and cleaning solvent",
    ],
    industries: ["Edible oil processing", "Adhesives", "Pharmaceuticals", "Polymers", "Laboratories", "Fuel testing"],
    form: "Clear, colourless, very volatile liquids with a petrol-like odour. n-Hexane boils at about 69 °C and n-heptane at about 98 °C. Neither mixes with water.",
    packaging: ["Steel drums", "IBC totes", "ISO tank containers", "Road tankers"],
    handling: [
      "Store in closed containers in a cool, well-ventilated area away from all ignition sources.",
      "Earth and bond all equipment; both liquids are static accumulators.",
      "Vapour is heavier than air and can travel to distant ignition sources; ventilate low areas.",
      "Keep apart from strong oxidisers and prevent release to drains.",
    ],
    hazards: [
      "Highly flammable liquids and vapours; flash points are well below 0 °C (about −22 °C for n-hexane and −4 °C for n-heptane).",
      "May be fatal if swallowed and enters the airways (aspiration hazard).",
      "Prolonged or repeated exposure to n-hexane can damage the peripheral nerves; n-hexane is also suspected of damaging fertility.",
      "Toxic to very toxic to aquatic life with long-lasting effects (n-hexane H411, n-heptane H410); vapours may cause drowsiness.",
    ],
    faqs: [
      {
        q: "What is the difference between n-heptane and n-hexane?",
        a: "Heptane has seven carbons and hexane six. Heptane boils higher (about 98 °C against 69 °C), evaporates more slowly and is much less neurotoxic, which is why it often replaces hexane in adhesives and labs.",
      },
      {
        q: "Why are heptane and hexane listed together?",
        a: "Both are saturated acyclic hydrocarbons classified under the same HSN code, 29011000, and they serve overlapping solvent uses.",
      },
      {
        q: "What is the difference between n-hexane and commercial hexane?",
        a: "n-Hexane is the single straight-chain isomer. Commercial or extraction-grade hexane is a blend of C6 isomers such as methylpentanes, with n-hexane as the main part. State which you need when you ask for a quote.",
      },
      {
        q: "Why is hexane used for oil extraction?",
        a: "Because it dissolves oils well, does not dissolve much protein or sugar, and boils low enough to be stripped from the meal and oil with modest heat and then recovered.",
      },
      {
        q: "Is an SDS available for heptane and hexane?",
        a: "Yes, an SDS is available on request for each.",
      },
    ],
    related: ["toluene", "methylene-chloride", "ethyl-acetate"],
  },

  // ───────────────────────────── Amines ─────────────────────────────
  {
    slug: "diisopropylamine",
    name: "Diisopropylamine",
    hsn: "29211990",
    group: "Amines",
    cas: ["108-18-9"],
    synonyms: ["DIPA", "N-Isopropylpropan-2-amine", "N,N-Diisopropylamine", "Di-isopropylamine"],
    summary:
      "Diisopropylamine (DIPA) is a sterically hindered secondary amine. It is the precursor to lithium diisopropylamide (LDA) and Hünig's base, and an intermediate for thiocarbamate herbicides, rubber chemicals and pharmaceuticals. It is flammable and corrosive.",
    metaSummary: "a hindered amine and intermediate for LDA, herbicides and rubber chemicals",
    applications: [
      "Precursor to lithium diisopropylamide (LDA), a strong non-nucleophilic base in organic synthesis",
      "Intermediate for N,N-diisopropylethylamine (Hünig's base, DIPEA)",
      "Intermediate for thiocarbamate herbicides",
      "Rubber vulcanisation accelerators",
      "Pharmaceutical and fine-chemical synthesis; corrosion inhibitors",
    ],
    industries: ["Pharmaceuticals", "Agrochemicals", "Rubber chemicals", "Fine chemicals", "Water treatment"],
    form: "Clear, colourless to pale yellow liquid with a strong ammonia-like, fishy odour. Boils at about 84 °C and is moderately soluble in water.",
    packaging: ["Steel or HDPE drums", "IBC totes suited to amines", "ISO tank containers"],
    handling: [
      "Store in tightly closed containers in a dry, cool, ventilated area, ideally under a nitrogen blanket, to keep out moisture and carbon dioxide.",
      "Earth and bond during transfer and use spark-free tools.",
      "Keep apart from acids, oxidisers, acid chlorides, anhydrides and nitrosating agents.",
      "Avoid copper, brass and other copper alloys in pumps and fittings; amines attack them.",
    ],
    hazards: [
      "Highly flammable liquid and vapour; the flash point is below room temperature.",
      "Causes severe skin burns and eye damage.",
      "Harmful if swallowed or inhaled; vapour irritates the respiratory tract.",
    ],
    faqs: [
      {
        q: "What is diisopropylamine used for?",
        a: "Mainly as a chemical intermediate: to make LDA and Hünig's base for organic synthesis, thiocarbamate herbicides, rubber accelerators and pharmaceutical ingredients.",
      },
      {
        q: "Is diisopropylamine the same as DIPEA?",
        a: "No. Diisopropylamine is a secondary amine. DIPEA (Hünig's base) is a tertiary amine made from it by adding an ethyl group.",
      },
      {
        q: "Why is DIPA described as hindered?",
        a: "Because its two bulky isopropyl groups crowd the nitrogen. That makes it, and especially its lithium salt LDA, a strong base that reacts poorly as a nucleophile.",
      },
      {
        q: "What HSN code covers diisopropylamine?",
        a: "Diisopropylamine is classified under HSN 29211990, other acyclic monoamines.",
      },
      {
        q: "Is DIPA always diisopropylamine?",
        a: "No. \"DIPA\" is also used for diisopropanolamine (CAS 110-97-4), a different chemical. Quote the CAS number 108-18-9 when you ask for diisopropylamine.",
      },
      {
        q: "Is an SDS available for diisopropylamine?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["toluene", "methylene-chloride", "methanol"],
  },

  // ───────────────────────────── Inorganics ─────────────────────────────
  {
    slug: "titanium-dioxide",
    name: "Titanium Dioxide",
    hsn: "282300",
    group: "Inorganics",
    cas: ["13463-67-7", "1317-80-2", "1317-70-0"],
    synonyms: ["TiO₂", "Titania", "Titanium(IV) oxide", "Rutile titanium dioxide", "Anatase titanium dioxide", "CI Pigment White 6", "CI 77891"],
    summary:
      "Titanium dioxide (TiO₂) is the most widely used white pigment, prized for high refractive index, opacity and brightness. Rutile grades dominate paints and plastics for their durability; anatase grades suit paper, fibres and some indoor uses.",
    metaSummary: "the most widely used white pigment, in rutile and anatase grades",
    applications: [
      "White pigment and opacifier in architectural and industrial paints and coatings",
      "Masterbatches, PVC profiles and other plastics",
      "Paper filling and coating, and printing inks",
      "UV filter and pigment in sunscreens and cosmetics",
      "Ceramics, rubber, synthetic fibres (delustrant) and welding-rod coatings",
    ],
    industries: ["Paints and coatings", "Plastics", "Paper", "Printing inks", "Cosmetics", "Ceramics", "Textiles"],
    form: "Fine, white, odourless powder. Insoluble in water and chemically very stable. Two commercial crystal forms: rutile and anatase.",
    packaging: ["Multi-wall paper bags", "Woven polypropylene bags", "Jumbo bags (FIBCs) on pallets"],
    handling: [
      "Store dry and off the floor; moisture causes caking and poor dispersion.",
      "Use dust extraction and avoid generating airborne dust during bag emptying.",
      "Wear a dust mask or respirator where dust cannot be controlled.",
      "Clean spills by vacuum or damp methods rather than dry sweeping; wet TiO₂ makes floors very slippery.",
    ],
    hazards: [
      "Fine dust may irritate the eyes and respiratory tract.",
      "IARC classifies titanium dioxide as possibly carcinogenic to humans (Group 2B), based on inhalation of dust; control airborne dust.",
    ],
    faqs: [
      {
        q: "What is the difference between rutile and anatase titanium dioxide?",
        a: "Rutile has a higher refractive index and better weather resistance, so it gives more opacity and durability in paints and plastics. Anatase is softer, bluer-white and less abrasive, and is used in paper, fibres and some indoor applications.",
      },
      {
        q: "Why is titanium dioxide so widely used as a white pigment?",
        a: "Because its very high refractive index scatters visible light strongly, giving excellent hiding power and brightness at low dosage.",
      },
      {
        q: "What does a surface treatment on TiO₂ do?",
        a: "Coatings such as alumina, silica or organic treatments improve dispersion and reduce photocatalytic activity, which protects the binder from chalking outdoors.",
      },
      {
        q: "What HSN code does titanium dioxide use?",
        a: "Titanium oxides fall under HSN 282300.",
      },
      {
        q: "Is an SDS available for titanium dioxide?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["copper-sulphate", "caustic-soda-flakes", "toluene"],
  },
  {
    slug: "caustic-soda-flakes",
    name: "Caustic Soda (solid)",
    hsn: "281511",
    group: "Inorganics",
    cas: ["1310-73-2"],
    synonyms: ["Sodium hydroxide", "NaOH", "Caustic soda flakes", "Caustic soda pearls", "Lye"],
    summary:
      "Solid caustic soda (sodium hydroxide) is a strong alkali sold as flakes or pearls. It is used for soap making, pH adjustment, alumina and pulp processing, textile mercerising and cleaning. It is highly corrosive and gives off heat when dissolved.",
    metaSummary: "solid sodium hydroxide flakes or pearls for soap, alumina, pulp and textiles",
    applications: [
      "Saponification in soap and detergent manufacture",
      "pH control and neutralisation in water and effluent treatment",
      "Pulp and paper processing, and alumina refining",
      "Textile scouring and mercerising of cotton",
      "Industrial and food-plant cleaning (CIP), and as a catalyst in biodiesel",
    ],
    industries: ["Soaps and detergents", "Water treatment", "Textiles", "Pulp and paper", "Aluminium", "Food processing", "Chemicals"],
    form: "White, odourless, hygroscopic flakes or small pearls. Dissolves readily in water with strong heat release.",
    packaging: ["Polyethylene-lined bags", "Woven polypropylene bags", "Jumbo bags (FIBCs)", "Steel or plastic drums"],
    handling: [
      "Keep bags sealed and store dry; flakes absorb moisture and carbon dioxide from air and cake.",
      "Always add caustic soda slowly to water while stirring, never water to caustic soda, to avoid violent boiling and spattering.",
      "Wear chemical goggles or a face shield, alkali-resistant gloves and protective clothing.",
      "Keep away from acids, aluminium, zinc and tin; it reacts with these metals to release flammable hydrogen.",
    ],
    hazards: [
      "Causes severe skin burns and eye damage; eye contact can cause blindness.",
      "Dissolving or neutralising it releases a lot of heat.",
      "May be corrosive to metals such as aluminium and zinc.",
    ],
    faqs: [
      {
        q: "What is the difference between caustic soda flakes and pearls?",
        a: "Only the physical shape. Flakes are thin scales; pearls (prills) are small beads that flow more freely and give off less dust. Chemically both are sodium hydroxide.",
      },
      {
        q: "Is caustic soda the same as soda ash?",
        a: "No. Caustic soda is sodium hydroxide, a much stronger alkali. Soda ash is sodium carbonate. They have different HSN codes and different uses.",
      },
      {
        q: "How should caustic soda flakes be dissolved?",
        a: "Add the flakes slowly to cold water while stirring, never the other way round. The solution heats up sharply, so use a heat-resistant vessel and full eye and skin protection.",
      },
      {
        q: "When should I buy solid caustic soda instead of liquid?",
        a: "Solid is usually chosen when freight distance is long or usage is small, since you do not pay to ship water. Liquid caustic suits plants that dose continuously and have tank storage.",
      },
      {
        q: "Is an SDS available for caustic soda?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["liquid-caustic-soda", "labsa", "copper-sulphate"],
  },
  {
    slug: "liquid-caustic-soda",
    name: "Liquid Caustic Soda",
    hsn: "281512",
    group: "Inorganics",
    cas: ["1310-73-2"],
    synonyms: ["Sodium hydroxide solution", "Caustic soda lye", "Caustic liquor", "Aqueous NaOH", "Soda lye"],
    summary:
      "Liquid caustic soda is sodium hydroxide dissolved in water, commonly traded near 48–50% or about 32% strength. It is easy to pump and meter, so it suits continuous dosing in water treatment, chemical processing, soap making and pulp bleaching.",
    metaSummary: "sodium hydroxide solution for dosing in water treatment, soap and pulp",
    applications: [
      "Neutralising acids from LABSA to make detergent active (sodium LAS)",
      "pH correction in water and effluent treatment",
      "Pulp and paper bleaching and pulping chemistry",
      "Alumina, textile and chemical processing",
      "Clean-in-place (CIP) cleaning in dairies, breweries and food plants",
    ],
    industries: ["Water treatment", "Detergents", "Pulp and paper", "Textiles", "Food and beverage", "Chemicals"],
    form: "Clear to slightly hazy, colourless, odourless liquid that is dense and somewhat viscous. 50% solution starts to crystallise at roughly 12 °C.",
    packaging: ["HDPE drums", "IBC totes", "Rubber-lined or stainless ISO tank containers", "Road tankers"],
    handling: [
      "Store in carbon-steel, stainless-steel or suitable HDPE tanks; never in aluminium, zinc, galvanised or brass equipment.",
      "In cold climates keep 50% solution warm or dilute it; it crystallises and can block lines.",
      "Wear a face shield, goggles, alkali-resistant gloves and protective clothing; provide safety showers and eyewash stations.",
      "Keep apart from acids; dilute by adding caustic to water slowly, as mixing releases heat.",
    ],
    hazards: [
      "Causes severe skin burns and eye damage; splashes can cause permanent eye injury.",
      "Corrosive to aluminium, zinc and tin, releasing flammable hydrogen.",
      "Reacts violently with acids, releasing heat.",
    ],
    faqs: [
      {
        q: "What concentration does liquid caustic soda come in?",
        a: "Most commonly around 48–50% NaOH, and also around 32%. Many users dilute it on site to the strength their process needs.",
      },
      {
        q: "Why does liquid caustic soda freeze in winter?",
        a: "Because 50% sodium hydroxide crystallises at roughly 12 °C. Lagged and heated tanks, or a lower concentration, avoid blocked lines.",
      },
      {
        q: "What HSN code does liquid caustic soda use?",
        a: "Sodium hydroxide in aqueous solution falls under HSN 281512.",
      },
      {
        q: "What materials can store liquid caustic soda?",
        a: "Carbon steel and stainless steel at ambient temperature, plus suitable HDPE or lined tanks. Avoid aluminium, zinc, galvanised steel, brass and copper alloys.",
      },
      {
        q: "Is an SDS available for liquid caustic soda?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["caustic-soda-flakes", "labsa", "copper-sulphate"],
  },
  {
    slug: "copper-sulphate",
    name: "Copper Sulphate",
    hsn: "283325",
    group: "Inorganics",
    cas: ["7758-99-8", "7758-98-7"],
    synonyms: ["Copper(II) sulphate", "Copper sulfate", "Cupric sulphate", "Blue vitriol", "Bluestone", "Copper sulphate pentahydrate"],
    summary:
      "Copper sulphate is a blue crystalline copper salt, usually traded as the pentahydrate. It is used as a fungicide (Bordeaux mixture), algaecide, animal-feed trace mineral, electroplating electrolyte and flotation agent in mining.",
    metaSummary: "a blue copper salt used as a fungicide, feed mineral and plating electrolyte",
    applications: [
      "Fungicide and Bordeaux mixture in agriculture",
      "Algae and snail control in ponds and irrigation water",
      "Copper source in animal feed and fertiliser micronutrient blends",
      "Electrolyte in copper electroplating and electrorefining",
      "Activator in froth flotation of zinc and other sulphide ores; wood preservation",
    ],
    industries: ["Agriculture", "Animal feed", "Electroplating", "Mining", "Water treatment", "Wood preservation"],
    form: "Bright blue crystals or crystalline powder (pentahydrate). The anhydrous form is a greyish-white powder that turns blue as it absorbs water.",
    packaging: ["Polyethylene-lined bags", "Woven polypropylene bags", "Jumbo bags (FIBCs)", "Fibre or plastic drums"],
    handling: [
      "Store in a dry, cool place in closed bags; the crystals cake in humid conditions and slowly lose water in very dry heat.",
      "Avoid storing solutions in iron, steel or galvanised vessels; copper plates out and the metal corrodes.",
      "Use dust control and wear gloves and eye protection when handling.",
      "Prevent spills from reaching drains or watercourses.",
    ],
    hazards: [
      "Harmful if swallowed.",
      "Causes skin irritation and serious eye irritation.",
      "Very toxic to aquatic life with long-lasting effects.",
    ],
    faqs: [
      {
        q: "What is the difference between copper sulphate pentahydrate and anhydrous?",
        a: "The pentahydrate (CuSO₄·5H₂O) contains water of crystallisation and is blue. The anhydrous form has none and is greyish-white. Pentahydrate is the common commercial form.",
      },
      {
        q: "What is copper sulphate used for in agriculture?",
        a: "As a fungicide, often mixed with lime to make Bordeaux mixture, as a micronutrient to correct copper deficiency in soil and feed, and to control algae in water bodies.",
      },
      {
        q: "Can copper sulphate solution be kept in a steel tank?",
        a: "No. Iron displaces copper from solution, so the tank corrodes and copper metal deposits. Use plastic, lined or suitable stainless-steel equipment.",
      },
      {
        q: "What HSN code does copper sulphate use?",
        a: "Copper sulphate falls under HSN 283325.",
      },
      {
        q: "Is an SDS available for copper sulphate?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["titanium-dioxide", "caustic-soda-flakes", "liquid-caustic-soda"],
  },

  // ───────────────────────────── Surfactants ─────────────────────────────
  {
    slug: "labsa",
    name: "LABSA",
    hsn: "340231",
    group: "Surfactants",
    cas: ["27176-87-0", "85536-14-7", "68584-22-5"],
    synonyms: [
      "Linear alkylbenzene sulphonic acid",
      "Linear alkyl benzene sulfonic acid",
      "Dodecylbenzenesulphonic acid",
      "DDBSA",
      "Sulphonic acid",
      "LAS acid",
    ],
    summary:
      "LABSA (linear alkylbenzene sulphonic acid) is the acid precursor of LAS, the most widely used anionic detergent active. Neutralised with caustic soda or soda ash, it gives the cleaning and foaming base of washing powders, dishwash liquids and cleaners.",
    metaSummary: "the acid precursor of LAS, the base of washing powders and dishwash liquids",
    applications: [
      "Detergent active in laundry powders and cakes after neutralisation",
      "Dishwashing liquids and hand-wash detergents",
      "Household and industrial hard-surface cleaners",
      "Emulsifier in agrochemical formulations",
      "Wetting agent in textile processing",
    ],
    industries: ["Detergents", "Household cleaning", "Industrial cleaning", "Agrochemicals", "Textiles"],
    form: "Brown, viscous, oily liquid with a slight sulphurous odour. Typically traded at about 96% active acid; viscosity rises sharply as temperature falls.",
    packaging: ["HDPE drums", "IBC totes", "Stainless-steel or lined ISO tank containers"],
    handling: [
      "Store in stainless-steel, HDPE or lined tanks; LABSA attacks mild steel, especially when moisture is present.",
      "Keep containers closed, as the acid absorbs water and becomes more corrosive.",
      "Neutralise with caustic soda or soda ash under controlled addition and cooling; the reaction is exothermic.",
      "Wear acid-resistant gloves, goggles or a face shield, and protective clothing.",
    ],
    hazards: [
      "Causes severe skin burns and eye damage.",
      "Harmful if swallowed.",
      "Harmful to aquatic life with long-lasting effects.",
    ],
    faqs: [
      {
        q: "What is the difference between LABSA and LAS?",
        a: "LABSA is the sulphonic acid form. LAS (linear alkylbenzene sulphonate) is its neutralised sodium salt, which is the actual detergent active in finished products.",
      },
      {
        q: "How is LABSA neutralised to make detergent?",
        a: "By slowly adding caustic soda solution or soda ash with stirring and cooling until the target pH is reached. About 0.12–0.13 kg of NaOH neutralises 1 kg of 96% LABSA, but always titrate to confirm.",
      },
      {
        q: "Why is linear alkylbenzene preferred over branched?",
        a: "Because linear chains biodegrade readily, whereas the older branched alkylbenzene sulphonates persisted and caused foaming in rivers.",
      },
      {
        q: "What HSN code does LABSA use?",
        a: "LABSA is classified under HSN 340231, linear alkylbenzene sulphonic acids and their salts.",
      },
      {
        q: "Is an SDS available for LABSA?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["sles-70", "liquid-caustic-soda", "alpha-olefin-sulphonate"],
  },
  {
    slug: "sles-70",
    name: "SLES 70%",
    hsn: "340239",
    group: "Surfactants",
    cas: ["9004-82-4", "68891-38-3", "68585-34-2"],
    synonyms: [
      "Sodium lauryl ether sulphate 70%",
      "Sodium laureth sulfate",
      "SLES paste",
      "Sodium alkyl ether sulphate",
      "Sodium C12-14 alcohol ethoxy sulphate",
    ],
    summary:
      "SLES 70% is a concentrated paste of sodium lauryl ether sulphate, the main foaming surfactant in shampoos, body washes and dishwash liquids. Its high active content keeps freight low, but it must be diluted with care to avoid a stiff gel phase.",
    metaSummary: "a concentrated anionic surfactant paste for shampoos, body washes and dishwash",
    applications: [
      "Primary surfactant in shampoos, body washes and liquid hand soaps",
      "Dishwashing liquids and liquid laundry detergents",
      "Car-wash and hard-surface cleaners",
      "Wetting and foaming agent in textiles and emulsion polymerisation",
    ],
    industries: ["Personal care", "Home care", "Detergents", "Textiles", "Institutional cleaning"],
    form: "Colourless to pale yellow, thick, gel-like paste of about 70% active matter. Commonly based on C12–14 fatty alcohol with an average of 2 or 3 moles of ethylene oxide.",
    packaging: ["HDPE drums", "IBC totes", "Flexitanks", "ISO tank containers"],
    handling: [
      "To dilute, add the paste to water slowly under strong stirring, not water to paste; passing quickly through the 30–60% range avoids an immovable gel.",
      "Store between about 15 °C and 40 °C; it stiffens in the cold and may hydrolyse with prolonged heat.",
      "Keep containers closed to stop surface skin and microbial contamination.",
      "Use pumps suited to viscous pastes, such as lobe or progressive-cavity pumps.",
    ],
    hazards: [
      "Causes serious eye damage at paste concentration.",
      "Causes skin irritation.",
      "Harmful to aquatic life; avoid undiluted release to drains.",
    ],
    faqs: [
      {
        q: "What is the difference between SLES 70% and SLES 28%?",
        a: "Only the water content. SLES 70% is a concentrated paste that is cheaper to ship per kilo of active; SLES 28% is a pumpable liquid that is easier to handle and dose but carries more water.",
      },
      {
        q: "How do I dilute SLES 70% without it turning to gel?",
        a: "Add the paste into water, not water into paste, under vigorous stirring. SLES forms a very viscous gel between roughly 30% and 60% active, so move through that range quickly.",
      },
      {
        q: "Is SLES the same as SLS?",
        a: "No. SLES is ethoxylated before sulphation, which makes it milder to skin and more soluble. SLS is sodium lauryl sulphate without ethoxylation.",
      },
      {
        q: "Does SLES contain 1,4-dioxane?",
        a: "Trace 1,4-dioxane can form as a by-product of ethoxylation, and levels depend on how the material is made. If your market sets a limit, state it in your enquiry.",
      },
      {
        q: "Is an SDS available for SLES 70%?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["sles-28", "sodium-lauryl-sulphate", "labsa"],
  },
  {
    slug: "sles-28",
    name: "SLES 28%",
    hsn: "340239",
    group: "Surfactants",
    cas: ["9004-82-4", "68891-38-3", "68585-34-2"],
    synonyms: [
      "Sodium lauryl ether sulphate 28%",
      "Sodium laureth sulfate solution",
      "Liquid SLES",
      "SLES 27%",
      "Sodium alkyl ether sulphate solution",
    ],
    summary:
      "SLES 28% is a ready-to-use liquid solution of sodium lauryl ether sulphate. It pumps and blends directly into shampoos, hand washes and detergents with no dilution step, which suits smaller plants without high-shear mixing.",
    metaSummary: "a ready-to-use anionic surfactant solution for shampoos and hand washes",
    applications: [
      "Direct blending into shampoos, body washes and hand soaps",
      "Dishwash and liquid detergent formulations",
      "Car shampoos and general-purpose cleaners",
      "Foaming agent in cosmetic and household products",
    ],
    industries: ["Personal care", "Home care", "Detergents", "Small-batch manufacturing"],
    form: "Clear to slightly hazy, colourless to pale yellow, free-flowing liquid of about 27–28% active matter. Usually contains a preservative.",
    packaging: ["HDPE drums", "IBC totes", "Flexitanks", "ISO tank containers"],
    handling: [
      "Store between about 5 °C and 40 °C in closed containers, out of direct sun.",
      "Keep containers sealed and use clean equipment; dilute surfactant solutions can support microbial growth once opened.",
      "Mix gently to avoid excess foam and trapped air.",
      "Can be pumped with standard centrifugal pumps.",
    ],
    hazards: [
      "Causes serious eye irritation.",
      "May cause skin irritation on prolonged contact.",
      "Harmful to aquatic life in concentrated form.",
    ],
    faqs: [
      {
        q: "When should I choose SLES 28% instead of SLES 70%?",
        a: "When you lack high-shear mixing or heated storage, or you use small quantities. SLES 28% blends directly, whereas the 70% paste needs careful dilution.",
      },
      {
        q: "Can I make SLES 28% from SLES 70%?",
        a: "Yes. Dilute 70% paste with water at a ratio of about 2:3 by weight, adding paste to water with good stirring, and add a preservative suited to your product.",
      },
      {
        q: "Why does SLES 28% contain a preservative?",
        a: "Because a dilute, water-rich surfactant solution can support bacteria and mould. The 70% paste is more self-preserving owing to its low water activity.",
      },
      {
        q: "What HSN code covers SLES 28%?",
        a: "SLES in both 28% and 70% strengths falls under HSN 340239, other anionic organic surface-active agents.",
      },
      {
        q: "Is an SDS available for SLES 28%?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["sles-70", "alpha-olefin-sulphonate", "sodium-lauryl-sulphate"],
  },
  {
    slug: "sodium-lauryl-sulphate",
    name: "SLS / Sodium Lauryl Sulphate",
    seoTitle: "Sodium Lauryl Sulphate Exporter, HSN 340239",
    hsn: "340239",
    group: "Surfactants",
    cas: ["151-21-3", "68585-47-7"],
    synonyms: [
      "Sodium lauryl sulfate",
      "Sodium dodecyl sulphate",
      "SDS (sodium dodecyl sulfate)",
      "Sodium monododecyl sulphate",
      "SLS needles",
      "SLS powder",
    ],
    summary:
      "Sodium lauryl sulphate (SLS) is a strong anionic surfactant with dense, quick foam. Sold as needles, powder or liquid, it is used in toothpaste, shampoo bars, powdered detergents, emulsion polymerisation and as SDS in laboratory protein work.",
    metaSummary: "a dense-foaming anionic surfactant for toothpaste and detergents",
    applications: [
      "Foaming agent in toothpaste and oral-care products",
      "Shampoos, shampoo bars and bath products",
      "Powder and tablet detergents",
      "Emulsifier in emulsion polymerisation and rubber latex",
      "Protein denaturant in laboratory electrophoresis (SDS-PAGE)",
    ],
    industries: ["Personal care", "Oral care", "Detergents", "Polymers", "Laboratories", "Textiles"],
    form: "White to cream needles, powder or noodles, typically above 90% active; also supplied as an aqueous solution around 30%. Faint fatty odour.",
    packaging: ["Polyethylene-lined fibre drums", "Multi-wall paper bags", "Woven polypropylene bags", "HDPE drums for liquid"],
    handling: [
      "Store dry in closed containers; the solid absorbs moisture and cakes.",
      "Minimise dust during handling; use local extraction and a dust mask.",
      "Keep fine powder away from ignition sources and avoid dust clouds.",
      "Keep apart from strong oxidisers and strong acids.",
    ],
    hazards: [
      "Dust and solid cause serious eye damage and skin irritation.",
      "Harmful if swallowed or inhaled; dust irritates the respiratory tract.",
      "The powder is a flammable solid and fine dust can form explosive mixtures with air.",
      "Harmful to aquatic life.",
    ],
    faqs: [
      {
        q: "What is the difference between SLS and SLES?",
        a: "SLS is sulphated lauryl alcohol; SLES has ethylene oxide units inserted before sulphation. SLS foams densely but is harsher on skin, whereas SLES is milder and easier to thicken with salt.",
      },
      {
        q: "Why are SLS needles preferred to powder?",
        a: "Because needles give off far less dust, which is easier on workers' eyes and lungs and lowers dust-explosion risk. Powder dissolves faster.",
      },
      {
        q: "Is SLS the same as SDS used in laboratories?",
        a: "Closely related. Commercial SLS is a blend of C12–14 alkyl sulphates, while laboratory SDS is essentially pure C12 sodium dodecyl sulphate.",
      },
      {
        q: "What HSN code does SLS use?",
        a: "Sodium lauryl sulphate falls under HSN 340239, other anionic organic surface-active agents.",
      },
      {
        q: "Is an SDS (safety data sheet) available for SLS?",
        a: "Yes, a safety data sheet is available on request.",
      },
    ],
    related: ["sles-70", "sodium-lauryl-sulphoacetate", "alpha-olefin-sulphonate"],
  },
  {
    slug: "alpha-olefin-sulphonate",
    name: "Alpha Olefin Sulphonate (AOS)",
    seoTitle: "Alpha Olefin Sulphonate Exporter, HSN 340239",
    hsn: "340239",
    group: "Surfactants",
    cas: ["68439-57-6"],
    synonyms: [
      "AOS",
      "Sodium C14-16 olefin sulphonate",
      "Sodium C14-16 olefin sulfonate",
      "Sodium alpha olefin sulfonate",
      "Olefin sulphonate",
    ],
    summary:
      "Alpha olefin sulphonate (AOS) is an anionic surfactant made from C14–16 alpha olefins. It foams well in hard water, stays stable across a wide pH range and biodegrades readily, making it a common sulphate-free alternative to SLES and SLS.",
    metaSummary: "a sulphate-free anionic surfactant that foams well in hard water",
    applications: [
      "Sulphate-free shampoos, body washes and hand soaps",
      "Liquid and powder laundry detergents and dishwash liquids",
      "Foaming agent for lightweight concrete and gypsum board",
      "Foaming and wetting agent in oilfield and textile processing",
    ],
    industries: ["Personal care", "Detergents", "Construction materials", "Oil and gas", "Textiles"],
    form: "Clear to pale yellow liquid of about 35–40% active, or white powder and needles of about 90% active.",
    packaging: ["HDPE drums", "IBC totes", "Flexitanks for liquid", "Lined bags or fibre drums for powder"],
    handling: [
      "Store liquid AOS between about 5 °C and 40 °C in closed containers; it is more cold-stable than SLES 70% paste.",
      "Store powder dry and minimise dust when handling.",
      "Use clean equipment; solutions should be preserved against microbial growth once opened.",
      "Wear eye protection and gloves during handling.",
    ],
    hazards: [
      "Causes serious eye damage, both as powder and in typical 35–40% solutions.",
      "Causes skin irritation.",
      "Harmful to aquatic life before dilution.",
    ],
    faqs: [
      {
        q: "Is AOS a sulphate-free surfactant?",
        a: "Yes. AOS is a sulphonate, not a sulphate, so it is widely used in products labelled sulphate-free.",
      },
      {
        q: "How does AOS compare with SLES?",
        a: "AOS gives quick, abundant foam and tolerates hard water better, but it thickens less readily with salt. Many formulas combine the two or add a co-surfactant such as cocamidopropyl betaine.",
      },
      {
        q: "Why is AOS used in foamed concrete?",
        a: "Because it produces fine, stable bubbles that survive mixing with cement, giving lightweight concrete and gypsum products a uniform cell structure.",
      },
      {
        q: "What HSN code does AOS use?",
        a: "Alpha olefin sulphonate falls under HSN 340239, other anionic organic surface-active agents.",
      },
      {
        q: "Is an SDS available for AOS?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["sles-28", "sodium-lauryl-sulphoacetate", "labsa"],
  },
  {
    slug: "sodium-lauryl-sulphoacetate",
    name: "Sodium Lauryl Sulphoacetate",
    seoTitle: "SLSA Exporter & Supplier, HSN 340239",
    hsn: "340239",
    group: "Surfactants",
    cas: ["1847-58-1"],
    synonyms: [
      "SLSA",
      "Sodium lauryl sulfoacetate",
      "Sodium dodecyl sulphoacetate",
      "Dodecyl sulphoacetate sodium salt",
    ],
    summary:
      "Sodium lauryl sulphoacetate (SLSA) is a mild anionic surfactant, usually a white powder or needles, with rich, creamy lather. It is a favourite for bath bombs, bubble bars, solid shampoo bars and syndet bars where a sulphate-free solid foamer is needed.",
    metaSummary: "a mild solid foamer for bath bombs and shampoo bars",
    applications: [
      "Bath bombs, bubble bars and bath melts",
      "Solid shampoo bars and syndet cleansing bars",
      "Sulphate-free shampoos, body washes and baby cleansers",
      "Toothpastes and some powder cleansing products",
    ],
    industries: ["Personal care", "Handmade cosmetics", "Oral care", "Baby care"],
    form: "White to off-white powder, needles or noodles with a mild odour, typically around 65–70% active. Disperses in warm water.",
    packaging: ["Polyethylene-lined fibre drums", "Lined cartons", "Multi-wall paper bags"],
    handling: [
      "Store dry in closed containers at room temperature; it absorbs moisture.",
      "The fine powder is very light and airborne easily; work with dust extraction and wear a dust mask.",
      "Wear eye protection when weighing or blending the powder.",
      "Keep apart from strong oxidisers.",
    ],
    hazards: [
      "Causes serious eye irritation or damage depending on form; dust is very irritating to eyes and nose.",
      "May cause respiratory irritation if dust is inhaled.",
      "Causes skin irritation in concentrated form.",
    ],
    faqs: [
      {
        q: "Is sodium lauryl sulphoacetate the same as sodium lauryl sulphate?",
        a: "No, despite the similar name. SLSA is an ester of sulphoacetic acid and is gentler, while SLS is a sulphate and is harsher on skin.",
      },
      {
        q: "Is SLSA sulphate-free?",
        a: "Yes. SLSA is a sulphonate-type surfactant, so it is widely used in products labelled sulphate-free.",
      },
      {
        q: "Why is SLSA popular for bath bombs and shampoo bars?",
        a: "Because it is a solid that blends into dry mixes with citric acid and bicarbonate, and gives dense, creamy foam once it meets warm water.",
      },
      {
        q: "How do I reduce dust when using SLSA powder?",
        a: "Choose needles or noodles instead of fine powder where possible, weigh in an enclosed or extracted area, and wear a dust mask and goggles.",
      },
      {
        q: "Is an SDS available for SLSA?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["sodium-lauryl-sulphate", "alpha-olefin-sulphonate", "sles-28"],
  },
  {
    slug: "alcohol-ethoxylates",
    name: "Alcohol Ethoxylates",
    hsn: "340242",
    group: "Surfactants",
    cas: ["68439-50-9", "68131-39-5", "68213-23-0", "9002-92-0"],
    synonyms: [
      "Fatty alcohol ethoxylates",
      "AE",
      "AEO",
      "Ethoxylated fatty alcohols",
      "Polyoxyethylene alkyl ethers",
      "Laureth-n",
    ],
    summary:
      "Alcohol ethoxylates are non-ionic surfactants made by reacting fatty alcohols with ethylene oxide. The number of EO units sets the balance between oil and water solubility, so one family covers detergents, textile wetting, emulsifiers and degreasers.",
    metaSummary: "non-ionic surfactants for detergents, degreasers, textiles and emulsifiers",
    applications: [
      "Detergency boosters in laundry liquids, powders and dishwash products",
      "Hard-surface, metal and industrial degreasing cleaners",
      "Wetting, scouring and levelling agents in textile processing",
      "Emulsifiers for agrochemicals, cosmetics and polymer emulsions",
    ],
    industries: ["Detergents", "Industrial cleaning", "Textiles", "Agrochemicals", "Paints and coatings", "Cosmetics"],
    form: "Clear liquids at low EO numbers, turning to pastes and waxy solids as the EO number rises. Commonly based on C12–14, C12–15 or C16–18 alcohols.",
    packaging: ["HDPE or steel drums", "IBC totes", "Flexitanks", "ISO tank containers", "Bags for solid flakes"],
    handling: [
      "Store in closed containers away from oxidisers; higher-EO grades may need gentle warming to melt before use.",
      "When diluting, watch for a gel phase at intermediate concentrations; add to water slowly with stirring.",
      "Avoid overheating melted material for long periods, which can darken and degrade it.",
      "Wear eye protection and gloves; spills are very slippery.",
    ],
    hazards: [
      "Many grades cause serious eye damage; most cause skin irritation.",
      "Harmful if swallowed.",
      "Toxic or harmful to aquatic life in undiluted form, though readily biodegradable.",
    ],
    faqs: [
      {
        q: "What does the EO number in an alcohol ethoxylate mean?",
        a: "It is the average number of ethylene oxide units per molecule. Low EO (2–5) grades are oil-soluble emulsifiers; mid EO (7–9) grades are strong detergents; high EO grades are water-soluble and waxy.",
      },
      {
        q: "What is the cloud point of an alcohol ethoxylate?",
        a: "The temperature at which a solution turns cloudy as the surfactant comes out of solution. It rises with EO number and is the usual quick way to identify a grade.",
      },
      {
        q: "Can alcohol ethoxylates replace NPE?",
        a: "In many uses, yes. Alcohol ethoxylates of similar HLB are the most common substitute for nonylphenol ethoxylates in detergents and textiles, though some formulas need adjustment.",
      },
      {
        q: "What HSN code covers alcohol ethoxylates?",
        a: "Alcohol ethoxylates fall under HSN 340242, non-ionic organic surface-active agents.",
      },
      {
        q: "Is an SDS available for alcohol ethoxylates?",
        a: "Yes, an SDS is available on request for each grade.",
      },
    ],
    related: ["nonylphenol-ethoxylates", "sles-70", "labsa"],
  },
  {
    slug: "nonylphenol-ethoxylates",
    name: "Nonylphenol Ethoxylates (NPE)",
    seoTitle: "Nonylphenol Ethoxylates Exporter, HSN 340242",
    hsn: "340242",
    group: "Surfactants",
    cas: ["9016-45-9", "127087-87-0", "26027-38-3"],
    synonyms: [
      "NPE",
      "NP-9",
      "NP-10",
      "Nonoxynol",
      "Polyoxyethylene nonylphenyl ether",
      "Ethoxylated nonylphenol",
    ],
    summary:
      "Nonylphenol ethoxylates (NPE) are non-ionic surfactants made from nonylphenol and ethylene oxide. They are effective, low-cost wetting agents, emulsifiers and detergents in industrial cleaning, textiles, paints and agrochemicals.",
    metaSummary: "non-ionic wetting agents and emulsifiers for industrial uses",
    applications: [
      "Industrial and institutional cleaners and degreasers",
      "Wetting, scouring and dyeing aids in textile and leather processing",
      "Emulsifiers in emulsion polymerisation and paints",
      "Emulsifiers in agrochemical concentrates",
      "Pulp and paper and oilfield chemicals",
    ],
    industries: ["Industrial cleaning", "Textiles", "Leather", "Paints and coatings", "Agrochemicals", "Pulp and paper"],
    form: "Clear, colourless to pale yellow liquids at common EO numbers such as NP-9 and NP-10; higher-EO grades are pastes or waxy solids.",
    packaging: ["HDPE or steel drums", "IBC totes", "ISO tank containers"],
    handling: [
      "Store in closed containers at ambient temperature away from oxidisers; warm higher-EO grades gently before pumping.",
      "Prevent any release to drains, soil or watercourses; contain spills with absorbent material.",
      "Add to water slowly with stirring to avoid gel formation.",
      "Wear eye protection and chemical-resistant gloves.",
    ],
    hazards: [
      "Causes serious eye damage; causes skin irritation.",
      "Harmful if swallowed.",
      "Breaks down in the environment to nonylphenol, which is very toxic to aquatic life and is an endocrine disruptor.",
    ],
    notes: [
      "NPE and nonylphenol are restricted in some markets, including the EU, where their use is limited in many applications and in imported textiles. Other countries also regulate them. Buyers should check the rules that apply in their market and application before ordering.",
    ],
    faqs: [
      {
        q: "Is NPE restricted?",
        a: "In some markets, yes. The EU limits nonylphenol and NPE in many uses and in imported textiles, and other countries regulate them too. Check the rules that apply where your product will be made and sold.",
      },
      {
        q: "What does NP-9 or NP-10 mean?",
        a: "The number is the average moles of ethylene oxide per molecule of nonylphenol. NP-9 and NP-10 are the common general-purpose detergent grades.",
      },
      {
        q: "What can replace nonylphenol ethoxylates?",
        a: "Alcohol ethoxylates of similar HLB are the most common alternative, along with other non-ionic surfactants. Formulas may need small adjustments.",
      },
      {
        q: "Why are NPEs an environmental concern?",
        a: "Because they degrade to nonylphenol, which persists in sediments, is toxic to aquatic organisms and can disrupt hormone systems in fish.",
      },
      {
        q: "Is an SDS available for NPE?",
        a: "Yes, an SDS is available on request.",
      },
    ],
    related: ["alcohol-ethoxylates", "labsa", "sles-70"],
  },
];

/** The generated "Do you export …?" question, phrased only from what the owner states: they export and supply it. */
export function exportFaq(p: Pick<Product, "name" | "hsn">): Faq {
  return {
    q: `Do you export ${p.name}?`,
    a: `Yes. ${site.name} exports and supplies ${p.name} (HSN ${p.hsn}). Send a quote request with quantity, packaging and destination port; SDS available on request.`,
  };
}

/** The product's own FAQs plus the export question, for the visible FAQ and the FAQPage JSON-LD alike. */
export function productFaqs(p: Product): Faq[] {
  return [...p.faqs, exportFaq(p)];
}

const bySlug = new Map(products.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}

/**
 * Case-insensitive search over name, synonyms, HSN prefix and CAS numbers,
 * optionally limited to one group. An empty query returns every product
 * (in the group, if given).
 */
export function searchProducts(query: string, group?: ProductGroup): Product[] {
  const q = query.trim().toLowerCase();
  const digits = q.replace(/\s+/g, "");
  return products.filter((p) => {
    if (group && p.group !== group) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.synonyms.some((s) => s.toLowerCase().includes(q)) ||
      (digits.length > 0 && p.hsn.startsWith(digits)) ||
      // Short digit strings would match inside almost any CAS number, so CAS needs 4+ characters or a dash.
      ((q.length >= 4 || q.includes("-")) && p.cas.some((c) => c.includes(q)))
    );
  });
}
