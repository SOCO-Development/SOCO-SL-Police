export interface DistrictColor {
  light: string;
  dark: string;
  hover: string;
}

export const DISTRICT_COLORS: Record<string, DistrictColor> = {
  Colombo: { light: '#bfdbfe', dark: '#1d4ed8', hover: '#93c5fd' },
  Gampaha: { light: '#bbf7d0', dark: '#15803d', hover: '#86efac' },
  Kalutara: { light: '#fed7aa', dark: '#c2410c', hover: '#fdba74' },
  Kandy: { light: '#fbcfe8', dark: '#be185d', hover: '#f9a8d4' },
  Matale: { light: '#ddd6fe', dark: '#6d28d9', hover: '#c4b5fd' },
  'Nuwara Eliya': { light: '#a5f3fc', dark: '#0e7490', hover: '#67e8f9' },
  Galle: { light: '#fef08a', dark: '#a16207', hover: '#fde047' },
  Matara: { light: '#fecaca', dark: '#b91c1c', hover: '#fca5a5' },
  Hambantota: { light: '#d9f99d', dark: '#4d7c0f', hover: '#bef264' },
  Jaffna: { light: '#c7d2fe', dark: '#4338ca', hover: '#a5b4fc' },
  Kilinochchi: { light: '#fbcfe8', dark: '#9d174d', hover: '#f9a8d4' },
  Mannar: { light: '#a7f3d0', dark: '#047857', hover: '#6ee7b7' },
  Vavuniya: { light: '#fde68a', dark: '#b45309', hover: '#fcd34d' },
  Mullaitivu: { light: '#e9d5ff', dark: '#7e22ce', hover: '#d8b4fe' },
  Batticaloa: { light: '#bae6fd', dark: '#0369a1', hover: '#7dd3fc' },
  Ampara: { light: '#fecdd3', dark: '#be123c', hover: '#fda4af' },
  Trincomalee: { light: '#99f6e4', dark: '#0f766e', hover: '#5eead4' },
  Kurunegala: { light: '#fed7aa', dark: '#9a3412', hover: '#fdba74' },
  Puttalam: { light: '#c7d2fe', dark: '#3730a3', hover: '#a5b4fc' },
  Anuradhapura: { light: '#bbf7d0', dark: '#166534', hover: '#86efac' },
  Polonnaruwa: { light: '#fde68a', dark: '#92400e', hover: '#fcd34d' },
  Badulla: { light: '#ddd6fe', dark: '#5b21b6', hover: '#c4b5fd' },
  Monaragala: { light: '#bfdbfe', dark: '#1e40af', hover: '#93c5fd' },
  Ratnapura: { light: '#fecaca', dark: '#991b1b', hover: '#fca5a5' },
  Kegalle: { light: '#a5f3fc', dark: '#155e75', hover: '#67e8f9' },
};

export const DEFAULT_DISTRICT_COLOR: DistrictColor = { light: '#e2e8f0', dark: '#334155', hover: '#94a3b8' };
