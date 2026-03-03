// Annex Data Constants for Crime Officer Management

export const ANNEX_01_SOCO_LABS = [
    'Ampara',
    'Anuradhapura',
    'Badulla',
    'Bandarawela',
    'Batticaloa',
    'Chilaw',
    'Colombo Central',
    'Colombo North',
    'Colombo South',
    'CRD SOCO Unit',
    'Dehiattakandiya',
    'Ebilipitiya',
    'Elpitiya',
    'Galle',
    'Gampaha',
    'Gampola',
    'Hatton',
    'Homagama',
    'Jaffna',
    'Kalutara',
    'Kandy',
    'Kantale',
    'Kegalle',
    'Kelaniya',
    'Kebithigollewa',
    'Killinochchi',
    'Kuliyapitiya',
    'Kurunegala',
    'Matale',
    'Matara',
    'Mannar',
    'Monaragala',
    'Mt. Lavinia',
    'Negombo',
    'Nikaweratiya',
    'Nugegoda',
    'Nuwara Eliya',
    'Mullativu',
    'Panadura',
    'Polonnaruwa',
    'Puttalam',
    'Ratnapura',
    'Seethawakapura',
    'SLPC Kalutara',
    'Tangalle',
    'Teldeniya',
    'Trincomalee',
    'Vavuniya',
] as const;

export const ANNEX_06_CIVIL_STATUS = ['Married', 'Unmarried'] as const;

export const ANNEX_07_SPOUSE_DESIGNATION = [
    'Police Office',
    'Doctor',
    'Lawyer',
    'Engineer',
    'Nurse',
    'Teacher',
    'Private Sector',
    'Unemployed',
    'Other',
] as const;

export const ANNEX_12_RANK = ['PC', 'PS', 'SI', 'IP', 'CI'] as const;

export type SocoLab = (typeof ANNEX_01_SOCO_LABS)[number];
export type CivilStatus = (typeof ANNEX_06_CIVIL_STATUS)[number];
export type SpouseDesignation = (typeof ANNEX_07_SPOUSE_DESIGNATION)[number];
export type OfficerRank = (typeof ANNEX_12_RANK)[number];
