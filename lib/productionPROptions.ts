/** Option value for “Others” — when selected, a free-text field is shown. */
export const PRODUCTION_PR_OTHERS_VALUE = 'Others';

/**
 * Tab-separated: Sinhala \t English
 * `value` stays Sinhala (or `Others`) for stable storage; `label` shows both languages.
 */
const BILINGUAL_RAW = `
රුධිරය හා රුධිර පැල්ලම්	Blood and blood stains
ශුක්‍රාණු සහ යෝනි ශ්‍රාවය	Semen and vaginal discharge
අස්ථි සහ ශරීර ඉන්ද්‍රියන්	Bones and body organs
කෙස් හා රෝම කූප	Hair and hair follicles
මූත්‍ර / ඛේටය / දහදිය හා වමනය	Urine / saliva / sweat and vomit
නියපොතු	nails
පටක හා න්‍යෂ්ටිය සහිත සෛල දැවටුනු භාණ්ඩ	Tissue and cell-containing products
පාවිච්චි කළ පුළුන් / පිස්න හා ටිෂූ	Used cotton/wool and tissues
පාවිච්චි කළ ඇදුම්	Used clothes
ඇද ඇතිරිලි / කොට්ට	Bed sheets/pillows
එන්නත් කටු	Injection needles
තියුණු ආයුධ හා මොට ආයුධ	Sharp weapons and blunt weapons
ඉතිරි වූ ආහාර කොටස්	Leftovers
සිගරට් ෆිල්ටර්	Cigarette filters
උපත් පාලන කොපු	Condoms
දත් බුරුසු	Toothbrushes
හිස පීරන පනා	Hair comb
වයර් කැබලි	pieces of wire
ලණු කැබලි	pieces of rope
පොලිතීන් / සෙලෝටේප් කැබලි	Pieces of polythene/sellotape
කැඩි ගිය ලී දඩු	Broken wooden sticks
කැඩි ගිය වීදුරු කැබලි	Broken glass pieces
කැඩිගිය ප්ලාස්ටික් කොටස්	Broken plastic parts
යකඩ කම්බි / ලෝහ කැබලි	Iron wire/metal scraps
යකඩ ඇණ	Iron nails
ගිනි අවි වලින් පිටවූ මූනිස්සම් හා හිස් උණ්ඩ කොපු	Explosives and empty shells from firearms
බෝම්බ කොටස්	Bomb parts
වාහන වලින් ගැලවී ගිය තීන්ත පතුරු	Paint flakes coming off vehicles
ගිනි අවි	firearms
පා සහ අත්ල සටහන්	Foot and palm prints
සපත්තු සටහන්	Shoe notes
පාවහන් සටහන්	Footprints
ටයර් සළකුණු	Tire markings
ආයුධ සළකුණු	Weapon symbols
කෙදි	fiber
හඩ පට	
වීඩියෝපට	Videos
සංයුක්ත තැටි	CDs
දෘඩ තැටි	Hard disk
පෙන්ඩ්‍රව්	Pendrav
මෙමරි කාඩ්	Memory card
ජංගම දුරකතන	Mobile phone
පරිගණක CPU	Computer CPU
Scanar	Scanar
Camara	Camara
දුරකතන සිම් කාඩ්පත්	Phone SIM cards
ව්‍යාජ මුදල් හා චෙක්පත්	Counterfeit money and checks
ක්‍රෙඩිට් කාඩ් / ඩෙබිඩ් කාඩ්	Credit card / Debit card
වාහන අංක තහඩු	Vehicle number plates
ලිපි ලේඛන	Documents
රසායනික ද්‍රව්‍ය / ඇසිඩ් වර්ග	Chemicals/Acids
අම්ල වර්ග	Types of acids
වෙඩි බෙහෙත්	gunpowder
C-4 / TNT	C-4 / TNT
වස වර්ග / පලිබෝධනාශක	Poisons / Pesticides
ශාඛමය වස වර්ග	Types of plant poisons
මත් ද්‍රව්‍ය හා මත්පැන්	Drugs and alcohol
ඖෂධ	Medicines
භූමිතෙල්	Kerosene
පෙට්‍රල් / ඩීසල්	Petrol / Diesel
Others	Others
`.trim();

function parseBilingualRows(raw: string): { value: string; label: string }[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tabIdx = line.indexOf('\t');
      const si = (tabIdx >= 0 ? line.slice(0, tabIdx) : line).trim();
      const en = (tabIdx >= 0 ? line.slice(tabIdx + 1) : '').trim();

      if (si === PRODUCTION_PR_OTHERS_VALUE) {
        return { value: PRODUCTION_PR_OTHERS_VALUE, label: 'Others' };
      }

      const label = en ? `${si} — ${en}` : si;
      return { value: si, label };
    });
}

export const PRODUCTION_PR_OPTIONS: { value: string; label: string }[] =
  parseBilingualRows(BILINGUAL_RAW);

export function productionPRHasOthersSelected(types: string[] | undefined): boolean {
  return (types ?? []).includes(PRODUCTION_PR_OTHERS_VALUE);
}

/** Resolve stored value (Sinhala or `Others`) to full bilingual label for display. */
export function getProductionPRDisplayLabel(storedValue: string): string {
  if (storedValue === PRODUCTION_PR_OTHERS_VALUE) return 'Others';
  const opt = PRODUCTION_PR_OPTIONS.find((o) => o.value === storedValue);
  return opt?.label ?? storedValue;
}

/** Dropdown options limited to items selected under Production Availability. */
export function productionOptionsForSelection(
  selected: string[] | undefined,
): { value: string; label: string }[] {
  if (!selected?.length) return [];
  const allowed = new Set(selected);
  return PRODUCTION_PR_OPTIONS.filter((o) => allowed.has(o.value));
}
