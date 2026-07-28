import type { DailyInput } from "./types";

/**
 * All indicators derived from the four entered numbers.
 *
 * Rules:
 *   petrecute (per category) = prezenți
 *   total     (per category) = prezenți + amânate
 *   total general            = teleconferință.total + instanță.total
 *   „la sediul judecătoriei"  = instanță.total
 */
export interface Indicators {
  tcPrezenti: number;
  tcAmanate: number;
  tcPetrecute: number;
  tcTotal: number;
  ijPrezenti: number;
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
  // A hearing is "petrecut" (held) when a party is present; the rest are amânate.
  const tcPetrecute = input.tc_prezenti;
  const tcTotal = tcPetrecute + input.tc_amanate;
  const ijPetrecute = input.ij_prezenti;
  const ijTotal = ijPetrecute + input.ij_amanate;

  return {
    tcPrezenti: input.tc_prezenti,
    tcAmanate: input.tc_amanate,
    tcPetrecute,
    tcTotal,
    ijPrezenti: input.ij_prezenti,
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
  tc_amanate: 0,
  ij_prezenti: 0,
  ij_amanate: 0,
};

/** Sum a list of daily inputs field by field. */
export function sumInputs(rows: DailyInput[]): DailyInput {
  return rows.reduce<DailyInput>(
    (acc, r) => ({
      tc_prezenti: acc.tc_prezenti + (r.tc_prezenti || 0),
      tc_amanate: acc.tc_amanate + (r.tc_amanate || 0),
      ij_prezenti: acc.ij_prezenti + (r.ij_prezenti || 0),
      ij_amanate: acc.ij_amanate + (r.ij_amanate || 0),
    }),
    { ...EMPTY },
  );
}

/** Aggregate many days into a single set of indicators. */
export function aggregate(rows: DailyInput[]): Indicators {
  return computeIndicators(sumInputs(rows));
}
