import type { CrimeSceneCourtDetails } from '@/types/crimeScene';
import { analysisInstitutionIsOthers } from '@/lib/analysisInstitutions';

export function validateProductionSentToCourtSection(cd: CrimeSceneCourtDetails | undefined): string {
  if (!cd) return '';
  const courtRows = cd.productionSentToCourtRows ?? [];
  for (let i = 0; i < courtRows.length; i++) {
    const row = courtRows[i];
    if (!row.productionRef?.trim()) continue;
    if (row.sentToCourt !== 'Yes' && row.sentToCourt !== 'No') {
      return `Production sent to court (row ${i + 1}): choose Yes or No for whether this production was sent to court.`;
    }
    if (row.sentToCourt === 'Yes') {
      if (!String(row.date ?? '').trim()) {
        return `Production sent to court (row ${i + 1}): enter the date sent to court.`;
      }
      if (!String(row.courtCaseNo ?? '').trim()) {
        return `Production sent to court (row ${i + 1}): enter the court case number.`;
      }
    }
  }
  return '';
}

export function validateSentToAnalysisSection(cd: CrimeSceneCourtDetails | undefined): string {
  if (!cd) return '';
  const analysisRows = cd.sentToAnalysisRows ?? [];
  for (let i = 0; i < analysisRows.length; i++) {
    const row = analysisRows[i];
    if (!row.productionRef?.trim()) continue;
    if (row.sentToAnalysis !== 'Yes' && row.sentToAnalysis !== 'No') {
      return `Sent to analysis institute (row ${i + 1}): choose Yes or No.`;
    }
    if (row.sentToAnalysis === 'Yes') {
      if (!String(row.date ?? '').trim()) {
        return `Sent to analysis institute (row ${i + 1}): enter the date.`;
      }
      const inst = String(row.institution ?? '').trim();
      if (!inst) {
        return `Sent to analysis institute (row ${i + 1}): select an institution.`;
      }
      if (analysisInstitutionIsOthers(inst) && !String(row.institutionOtherDetail ?? '').trim()) {
        return `Sent to analysis institute (row ${i + 1}): specify the institution.`;
      }
      if (!String(row.refNo ?? '').trim()) {
        return `Sent to analysis institute (row ${i + 1}): enter the reference number.`;
      }
    }
  }
  return '';
}

/** Validation for production / court rows when saving court details (matches create crime scene rules). */
export function validateCourtProductionDetails(cd: CrimeSceneCourtDetails | undefined): string {
  const a = validateProductionSentToCourtSection(cd);
  if (a) return a;
  return validateSentToAnalysisSection(cd);
}
