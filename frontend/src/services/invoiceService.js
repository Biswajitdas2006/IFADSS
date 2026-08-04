import apiClient from './apiClient';

export async function uploadInvoice(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return response.data.data;
}

export async function getInvoice(invoiceId) {
  const response = await apiClient.get(`/invoices/${invoiceId}`);
  return response.data.data;
}

export async function getInvoices(status, page = 1, pageSize = 20) {
  const response = await apiClient.get('/invoices', { params: { status, page, pageSize } });
  return response.data.data;
}