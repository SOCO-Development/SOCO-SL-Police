import { apiRequest } from './client';
import type { UploadProductionAnalysisReportResponse } from './types';

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
