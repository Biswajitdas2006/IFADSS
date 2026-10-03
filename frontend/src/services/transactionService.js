// import apiClient from './apiClient';

// export async function getTransactions({ category, from, to, page = 1, pageSize = 20 } = {}) {
//   const response = await apiClient.get('/transactions', {
//     params: { category, from, to, page, pageSize },
//   });
//   return response.data.data;
// }
import apiClient from './apiClient';

export async function getTransactions({
  category,
  from,
  to,
  page = 1,
  pageSize = 20,
} = {}) {
  const response = await apiClient.get('/transactions', {
    params: {
      category,
      from,
      to,
      page,
      pageSize,
    },
  });

  return response.data.data;
}

export async function updateTransactionCategory(transactionId, category) {
  const response = await apiClient.patch(
    `/transactions/${transactionId}/category`,
    { category }
  );

  return response.data.data;
}

export const CATEGORY_OPTIONS = [
  'Office Supplies',
  'Travel',
  'Utilities',
  'Rent',
  'Payroll',
  'Software/Subscriptions',
  'Marketing',
  'Professional Fees',
  'Miscellaneous',
];