/**
 * Court / magistrate names for crime scene court details (deduplicated, stable order).
 */

const RAW = `
Akkarapaththuwa MC 1
Akkarapaththuwa MC 2
ALUTHKADE HIGH COURT
ALUTHKADE HIGH COURT 1
ALUTHKADE HIGH COURT 2
ALUTHKADE HIGH COURT 3
ALUTHKADE HIGH COURT 4
ALUTHKADE HIGH COURT 5
ALUTHKADE HIGH COURT 6
ALUTHKADE HIGH COURT 7
ALUTHKADE HIGH COURT 8
ALUTHKADE MC 1
ALUTHKADE MC 2
ALUTHKADE MC 3
ALUTHKADE MC 4
ALUTHKADE MC 5
ALUTHKADE MC 6
ALUTHKADE MC 7
ALUTHKADE MC 8
AMPARA - HIGH COURT
AMPARA MC
Ampara MC 1
Ampara MC 2
ANAMADUWA MC
ANGUNAKOLAPELESSA MC
ANURADAPURA HIGH COURT
ATHTHANAGALLA MC
AVISSAWELLA High Court
AVISSAWELLA MC
Awissawella  High Court
Baddegama High Court
Badulla High Court
BADULLA High Court
Badulla MC
BAKAMOONA  MC
BATTICALOA – HIGH COURT
BATTICALOA MC
Bibile MC
CHAWAKACHCHERI MC
CHILAW High Court
CHILAW MC
Dambulla MC
Deiyandara MC
Embilipitiya High Court
Embilipitiya MC
ERAVUR MC
Fort MC
Galagedara MC
GALGAMUWA MC
Galle High Court
Galle MC
GAMPAHA High Court
GAMPAHA MC
Gampola MC
HAMBANTOTA High Court
Hambantota High Court
HAMBANTOTA MC
Hatton MC
Helboda MC
HETTIPOLA MC
HINGURAKGODA MC
Homagama High Court
HOMAGAMA MC
JAFFNA High Court
JAFFNA MC
KADUWELA MC
Kalmuna High Court
Kalmuna MC 1
Kalmuna MC 2
KALPITIYA MC
Kaluatara High court
Kalutara MC
KALUWANCHIKUDY MC
KANDY High Court
Kandy High Court
Kandy MC
Kandy MC 1
Kandy MC 2
KANTHALE MC
KAYTS MC
KEGALLA High Court
Kegalle High Court
KEGALLE MC
KEKIRAWA  MC
Kesbewa  MC
Kibissa Mc
KILINOCHCHI High Court
KILINOCHCHI MC
Kinniya MC
Kuchchaweli MC
KULIYAPITIYA High Court
KULIYAPITIYA MC
KURUNEGALA High Court
Laggala MC
Mahara MC
Mahiyanganaya MC
MAHIYANGANAYA MC
MAHO MC
Maligakanda MC
MALLAKAM MC
MANNAR High Court
MANNAR MC 1
MANNAR MC 2
MARAWILA MC
Matala High Court
Matale MC
Matara High Court
Matara MC
Mathugama MC
Mawanella MC
Mawathagoda MC
MINUWANGODA MC
Monaragala High Court
Monaragala MC
Moratuwa MC
Morawaka MC
MORAWEWA TOURIST MC
Mount Lavinia MC
Muthur MC
MUTUR MC
NARAMMALA MC
Naula MC
Nawalapitiya MC
NEGOMBO High Court
Negombo High Court
NEGOMBO MC
NIKAWRERATIYA MC
Nugegoda MC
NUGEGODA MC
Nuwaraeliya High Court
NUWARAELIYA High Court
Padaviya MC
Paldeniya MC
Panadura High Court
PANVIL MC
Passara MC
Pelmadulla MC
PETTAH MC
POINT PEDRO MC
POLONNARUWA HIGH COURT
POLONNARUWA MC 1
POLONNARUWA MC 2
Pothuvil MC
PUGODA MC
PUTTALAM  High Court
PUTTALAM  MC
RUWANWELLA  MC
Samanthura MC
Siyambalanduwa MC
TANGALLE High Court
TANGALLE MC
TELDENIYA MC
TISSAMAHARAMA MC
Trincomalee  MC
TRINCOMALEE High Court
Trincomalee High Court
Udugama High Court
VAHARAI MC
VALACHCHENAI  MC
Vavuniya High Court
Vavuniya MC
WALAPANE MC
WALASMULLA MC
WARAKAPOLA  MC
Warakapola MC
WARIYAPOLA MC
WELISARA MC
Wellawaya MC
`.trim();

function uniqueCourtNames(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of RAW.split('\n')) {
    const name = line.trim();
    if (!name) continue;
    const key = name.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

const NAMES = uniqueCourtNames();

export const COURT_NAME_OPTIONS: { value: string; label: string }[] = NAMES.map((name) => ({
  value: name,
  label: name,
}));
