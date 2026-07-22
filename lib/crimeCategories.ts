export interface CrimeCategoryDatum {
  name: string;
  value: number;
  fill: string;
  [key: string]: string | number;
}

export const CRIME_CATEGORY_DATA: CrimeCategoryDatum[] = [
  { name: 'Theft', value: 245, fill: '#c41e3a' },
  { name: 'Assault', value: 180, fill: '#f0ad4e' },
  { name: 'Burglary', value: 142, fill: '#9b5b8f' },
  { name: 'Fraud', value: 95, fill: '#004085' },
  { name: 'Drug Offences', value: 74, fill: '#28a745' },
  { name: 'Traffic Offences', value: 61, fill: '#fd7e14' },
  { name: 'Other', value: 53, fill: '#6c757d' },
];
