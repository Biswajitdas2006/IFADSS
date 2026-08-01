import apiClient from './apiClient';

export async function uploadInvoice(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function getInvoice(invoiceId) {
  const response = await apiClient.get(`/invoices/${invoiceId}`);
  return response.data.data;
}

export async function getInvoices(status, page = 1, pageSize = 20) {
  const response = await apiClient.get('/invoices', {
    params: { status, page, pageSize },
  });
  return response.data.data;
}