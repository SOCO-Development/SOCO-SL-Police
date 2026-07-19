import { apiRequest } from './client';
import type {
  UploadProductionAnalysisReportResponse,
  UploadProductionCourtAffidavitResponse,
} from './types';

/**
 * Upload a production analysis report file.
 *
 * Sends the file and its associated production-sent-analysis ID as
 * multipart/form-data to `File/UploadProductionAnalysisReport`.
 *
 * @param file                     - The file to upload.
 * @param productionSentAnalysisId - The related production-sent-analysis ID (defaults to 0).
 * @returns The server-side file path of the uploaded report.
 */
export async function uploadProductionAnalysisReport(
  file: File,
  productionSentAnalysisId: number = 0,
): Promise<UploadProductionAnalysisReportResponse> {
  const formData = new FormData();
  formData.append('File', file);
  formData.append('ProductionSentAnalysisId', String(productionSentAnalysisId));

  return apiRequest<UploadProductionAnalysisReportResponse>(
    'File/UploadProductionAnalysisReport',
    {
      method: 'POST',
      body: formData,
      formData: true,
    },
  );
}

/**
 * Upload a production court affidavit (or questionnaire).
 *
 * @param file                  - The file to upload.
 * @param productionSentCourtId - The related production-sent-court ID (defaults to 0).
 * @param reportType            - "Affidavit" or "Questionnaire".
 * @returns The server-side file path of the uploaded report.
 */
export async function uploadProductionCourtAffidavit(
  file: File,
  productionSentCourtId: number = 0,
  reportType: string = 'Affidavit',
): Promise<UploadProductionCourtAffidavitResponse> {
  const formData = new FormData();
  formData.append('File', file);
  formData.append('ProductionSentCourtId', String(productionSentCourtId));
  formData.append('ReportType', reportType);

  return apiRequest<UploadProductionCourtAffidavitResponse>(
    'File/UploadProductionCourtAffidavit',
    {
      method: 'POST',
      body: formData,
      formData: true,
    },
  );
}

/**
 * Upload a production court questionnaire.
 *
 * @param file                  - The file to upload.
 * @param productionSentCourtId - The related production-sent-court ID (defaults to 0).
 * @param reportType            - "Questionnaire".
 * @returns The server-side file path of the uploaded report.
 */
export async function uploadProductionCourtQuestionaire(
  file: File,
  productionSentCourtId: number = 0,
  reportType: string = 'Questionnaire',
): Promise<UploadProductionCourtAffidavitResponse> {
  const formData = new FormData();
  formData.append('File', file);
  formData.append('ProductionSentCourtId', String(productionSentCourtId));
  formData.append('ReportType', reportType);

  return apiRequest<UploadProductionCourtAffidavitResponse>(
    'File/UploadProductionCourtQuestionaire',
    {
      method: 'POST',
      body: formData,
      formData: true,
    },
  );
}
