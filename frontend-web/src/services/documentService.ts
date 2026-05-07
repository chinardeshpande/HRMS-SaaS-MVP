import api from './api';

export interface DocumentGenerationRequest {
  templateId: string;
  employeeId?: string;
  variables: Record<string, string>;
  format: 'PDF' | 'DOCX';
}

export interface DocumentGenerationResponse {
  documentId: string;
  fileName: string;
  fileUrl: string;
  format: string;
  generatedAt: string;
}

export interface DocumentHistory {
  documentId: string;
  templateName: string;
  fileName: string;
  format: string;
  status?: string;
  fileSizeBytes?: number;
  generatedAt: string;
  generatedBy: string;
}

class DocumentService {
  /**
   * Generate a document from a template
   */
  async generateDocument(data: DocumentGenerationRequest): Promise<Blob> {
    try {
      console.log('Generating document with data:', data);

      // api.post returns response.data, which is the Blob when responseType is 'blob'
      const blob = await api.post('/document-templates/generate', data, {
        responseType: 'blob',
      });

      console.log('Response type:', typeof blob);
      console.log('Is Blob?', blob instanceof Blob);

      if (blob instanceof Blob) {
        console.log('Document generated successfully, blob size:', blob.size, 'bytes');
        return blob;
      } else {
        console.error('Response is not a Blob:', blob);
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Document generation error:', error);
      console.error('Error response:', error.response);

      // If error response is a blob, try to read it as JSON
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        console.error('Error response text:', text);
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error?.message || errorData.message || 'Failed to generate document');
        } catch (parseError) {
          throw new Error(text || 'Failed to generate document');
        }
      }

      // Check if there's a message in the error
      const errorMessage = error.response?.data?.error?.message ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to generate document. Please try again.';

      throw new Error(errorMessage);
    }
  }

  /**
   * Get document generation history
   */
  async getDocumentHistory(limit = 50): Promise<DocumentHistory[]> {
    const response = await api.get('/document-templates/history', {
      params: { limit },
    });
    return response.data?.history || [];
  }

  /**
   * Download a previously generated document
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    const blob = await api.get(`/document-templates/generated/${documentId}/download`, {
      responseType: 'blob',
    });
    return blob as unknown as Blob;
  }

  /**
   * Delete a document from history
   */
  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/document-templates/generated/${documentId}`);
  }

  /**
   * Helper function to trigger file download in browser
   */
  downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate and download document in one operation
   */
  async generateAndDownload(data: DocumentGenerationRequest, fileName: string): Promise<void> {
    try {
      const blob = await this.generateDocument(data);
      this.downloadBlob(blob, fileName);
    } catch (error) {
      console.error('Error generating document:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();
export default documentService;
