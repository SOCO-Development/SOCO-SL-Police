/** Analysis / forensic institutions for “Sent to analysis institute”. */
export const ANALYSIS_INSTITUTION_OTHERS_VALUE = 'Others';

export function analysisInstitutionIsOthers(institution: string | undefined): boolean {
  return institution === ANALYSIS_INSTITUTION_OTHERS_VALUE;
}

/** Read-only label for detail views when institution is Others with optional detail. */
export function formatAnalysisInstitutionDisplay(row: {
  institution?: string;
  institutionOtherDetail?: string;
}): string {
  const inst = row.institution?.trim() ?? '';
  if (!inst) return '';
  if (analysisInstitutionIsOthers(inst)) {
    const other = row.institutionOtherDetail?.trim() ?? '';
    return other ? `Others — ${other}` : 'Others';
  }
  return inst;
}

export const ANALYSIS_INSTITUTION_OPTIONS = [
  'GAD',
  'Genetech',
  'JMO',
  'Finger Print',
  'Facial Recognize (CRD)',
  'Archaeology',
  'Veterinary',
  'Agricultural Material Controller',
  'Geological and Mining Bureau',
  'Atomic Energy Regulatory Authority',
  'Gem and Jewellery Authority',
  'Central Environmental Authority',
  'Others',
].map((label) => ({ value: label, label }));
