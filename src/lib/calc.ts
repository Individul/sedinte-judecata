import type { DailyInput } from "./types";

/**
 * All indicators derived from the six entered numbers.
 *
 * Rules (verified against the source table):
 *   petrecute (per category) = prezenți + examinați în lipsa lor
 *   total     (per category) = petrecute + amânate
 *   total general            = teleconferință.total + instanță.total
 *   „la sediul judecătoriei"  = instanță.total
 */
export interface Indicators {
  tcPrezenti: number;
  tcExaminatiLipsa: number;
  tcAmanate: number;
  tcPetrecute: number;
  tcTotal: number;
  ijPrezenti: number;
  ijExaminatiLipsa: number;
  ijAmanate: number;
  ijPetrecute: number;
  ijTotal: number;
  // headline
  total: number;
  petrecute: number;
  amanate: number;
  laSediu: number;
}

export function computeIndicators(input: DailyInput): Indicators {
  const tcPetrecute = input.tc_prezenti + input.tc_examinati_lipsa;
  const tcTotal = tcPetrecute + input.tc_amanate;
  const ijPetrecute = input.ij_prezenti + input.ij_examinati_lipsa;
  const ijTotal = ijPetrecute + input.ij_amanate;

  return {
    tcPrezenti: input.tc_prezenti,
    tcExaminatiLipsa: input.tc_examinati_lipsa,
    tcAmanate: input.tc_amanate,
    tcPetrecute,
    tcTotal,
    ijPrezenti: input.ij_prezenti,
    ijExaminatiLipsa: input.ij_examinati_lipsa,
    ijAmanate: input.ij_amanate,
    ijPetrecute,
    ijTotal,
    total: tcTotal + ijTotal,
    petrecute: tcPetrecute + ijPetrecute,
    amanate: input.tc_amanate + input.ij_amanate,
    laSediu: ijTotal,
  };
}

const EMPTY: DailyInput = {
  tc_prezenti: 0,
  tc_examinati_lipsa: 0,
  tc_amanate: 0,
  ij_prezenti: 0,
  ij_examinati_lipsa: 0,
  ij_amanate: 0,
};

/** Sum a list of daily inputs field by field. */
export function sumInputs(rows: DailyInput[]): DailyInput {
  return rows.reduce<DailyInput>(
    (acc, r) => ({
      tc_prezenti: acc.tc_prezenti + (r.tc_prezenti || 0),
      tc_examinati_lipsa: acc.tc_examinati_lipsa + (r.tc_examinati_lipsa || 0),
      tc_amanate: acc.tc_amanate + (r.tc_amanate || 0),
      ij_prezenti: acc.ij_prezenti + (r.ij_prezenti || 0),
      ij_examinati_lipsa: acc.ij_examinati_lipsa + (r.ij_examinati_lipsa || 0),
      ij_amanate: acc.ij_amanate + (r.ij_amanate || 0),
    }),
    { ...EMPTY },
  );
}

/** Aggregate many days into a single set of indicators. */
export function aggregate(rows: DailyInput[]): Indicators {
  return computeIndicators(sumInputs(rows));
}
