// import { useState, useEffect, useCallback } from 'react';
// import { getTransactions } from '../services/transactionService';
// import AppLayout from '../components/layout/AppLayout';
// import { theme } from '../styles/theme';

// function confidenceColor(confidence) {
//   if (confidence == null) return theme.colors.textMuted;
//   if (confidence >= 0.85) return theme.colors.success;
//   if (confidence >= 0.6) return theme.colors.warning;
//   return theme.colors.error;
// }

// function TransactionsPage() {
//   const [data, setData] = useState(null);
//   const [page, setPage] = useState(1);
//   const [loading, setLoading] = useState(true);

//   const load = useCallback(async () => {
//     setLoading(true);
//     const result = await getTransactions({ page, pageSize: 20 });
//     setData(result);
//     setLoading(false);
//   }, [page]);

//   useEffect(() => { load(); }, [load]);

//   const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
//   const to = data ? Math.min(data.page * data.pageSize, data.totalItems) : 0;

//   return (
//     <AppLayout>
//       <h1 style={styles.heading}>Transactions</h1>
//       <p style={styles.subheading}>Every transaction extracted from your invoices, with AI-assigned categories.</p>

//       <div style={styles.tableCard}>
//         <table style={styles.table}>
//           <thead>
//             <tr>
//               <th style={styles.th}>Date</th>
//               <th style={styles.th}>Description</th>
//               <th style={styles.th}>Category</th>
//               <th style={styles.th}>Confidence</th>
//               <th style={styles.thRight}>Amount</th>
//             </tr>
//           </thead>
//           <tbody>
//             {!loading && data?.items.length === 0 && (
//               <tr><td colSpan={5} style={styles.emptyCell}>
//                 No transactions yet — upload an invoice to get started.
//               </td></tr>
//             )}
//             {data?.items.map((t) => (
//               <tr key={t.id} style={styles.row}>
//                 <td style={styles.td}>{t.transactionDate}</td>
//                 <td style={styles.td}>{t.description}</td>
//                 <td style={styles.td}>
//                   {t.category ? (
//                     <span style={styles.categoryBadge}>
//                       {t.category}
//                       {t.overriddenByUser && <span style={styles.overrideTag}> · edited</span>}
//                     </span>
//                   ) : (
//                     <span style={styles.uncategorized}>Uncategorized</span>
//                   )}
//                 </td>
//                 <td style={styles.td}>
//                   {t.categoryConfidence != null ? (
//                     <div style={styles.confidenceWrap}>
//                       <div style={styles.confidenceTrack}>
//                         <div
//                           style={{
//                             ...styles.confidenceFill,
//                             width: `${Math.round(t.categoryConfidence * 100)}%`,
//                             backgroundColor: confidenceColor(t.categoryConfidence),
//                           }}
//                         />
//                       </div>
//                       <span style={styles.confidenceLabel}>
//                         {Math.round(t.categoryConfidence * 100)}%
//                       </span>
//                     </div>
//                   ) : (
//                     <span style={styles.uncategorized}>—</span>
//                   )}
//                 </td>
//                 <td style={styles.tdRight}>${t.amount.toFixed(2)}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {data && (
//           <div style={styles.footer}>
//             <span style={styles.footerText}>
//               Showing {data.totalItems === 0 ? 0 : from} to {to} of {data.totalItems} transactions
//             </span>
//             <div style={styles.pagerButtons}>
//               <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={styles.pagerButton}>
//                 Prev
//               </button>
//               <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} style={styles.pagerButton}>
//                 Next
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </AppLayout>
//   );
// }

// const styles = {
//   heading: { color: theme.colors.inkBase, fontFamily: theme.fonts.display, fontSize: '24px', margin: 0 },
//   subheading: { color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: '14px', marginTop: '4px', marginBottom: '24px' },
//   tableCard: {
//     backgroundColor: theme.colors.white, border: `1px solid ${theme.colors.border}`,
//     borderRadius: theme.radius.md, overflow: 'hidden',
//   },
//   table: { width: '100%', borderCollapse: 'collapse', fontFamily: theme.fonts.body },
//   th: { textAlign: 'left', padding: '12px 20px', fontSize: '11px', color: theme.colors.textMuted, borderBottom: `1px solid ${theme.colors.border}` },
//   thRight: { textAlign: 'right', padding: '12px 20px', fontSize: '11px', color: theme.colors.textMuted, borderBottom: `1px solid ${theme.colors.border}` },
//   row: { borderBottom: `1px solid ${theme.colors.border}` },
//   td: { padding: '14px 20px', fontSize: '14px', color: theme.colors.inkBase },
//   tdRight: { padding: '14px 20px', fontSize: '14px', color: theme.colors.inkBase, textAlign: 'right', fontFamily: theme.fonts.mono },
//   categoryBadge: {
//     backgroundColor: theme.colors.surfaceWash, color: theme.colors.primaryEmerald,
//     padding: '3px 10px', borderRadius: theme.radius.sm, fontSize: '12px', fontWeight: 600,
//   },
//   overrideTag: { fontWeight: 400, fontStyle: 'italic', opacity: 0.8 },
//   uncategorized: { fontSize: '13px', color: theme.colors.textMuted, fontStyle: 'italic' },
//   confidenceWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
//   confidenceTrack: { width: '60px', height: '5px', backgroundColor: theme.colors.border, borderRadius: '3px', overflow: 'hidden' },
//   confidenceFill: { height: '100%', borderRadius: '3px' },
//   confidenceLabel: { fontSize: '12px', color: theme.colors.textMuted, fontFamily: theme.fonts.mono },
//   emptyCell: { padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontSize: '14px' },
//   footer: {
//     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//     padding: '12px 20px', backgroundColor: theme.colors.surfaceWash,
//   },
//   footerText: { fontSize: '13px', color: theme.colors.textMuted },
//   pagerButtons: { display: 'flex', gap: '8px' },
//   pagerButton: {
//     padding: '6px 14px', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`,
//     backgroundColor: theme.colors.white, cursor: 'pointer', fontSize: '13px', color: theme.colors.inkBase,
//   },
// };

// export default TransactionsPage;
import { useState, useEffect, useCallback } from 'react';
import {
  getTransactions,
  updateTransactionCategory,
  CATEGORY_OPTIONS,
} from '../services/transactionService';
import AppLayout from '../components/layout/AppLayout';
import { theme } from '../styles/theme';

function CategoryCell({ transaction, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (newCategory) => {
    if (!newCategory) return;

    setSaving(true);
    setError('');

    try {
      const result = await updateTransactionCategory(
        transaction.id,
        newCategory
      );

      onUpdated(result);
      setEditing(false);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to update category.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div>
        <select
          autoFocus
          defaultValue={transaction.category ?? ''}
          onChange={(e) => handleSave(e.target.value)}
          onBlur={() => setEditing(false)}
          disabled={saving}
          style={styles.categorySelect}
        >
          <option value="" disabled>
            Select category…
          </option>

          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {error && (
          <div style={styles.inlineError}>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      style={styles.categoryButton}
    >
      {transaction.category ? (
        <span style={styles.categoryBadge}>
          {transaction.category}

          {transaction.overriddenByUser && (
            <span style={styles.overrideTag}>
              {' '}· edited
            </span>
          )}
        </span>
      ) : (
        <span style={styles.uncategorized}>
          Uncategorized — click to set
        </span>
      )}
    </button>
  );
}

function confidenceColor(confidence) {
  if (confidence == null) return theme.colors.textMuted;
  if (confidence >= 0.85) return theme.colors.success;
  if (confidence >= 0.6) return theme.colors.warning;
  return theme.colors.error;
}

function TransactionsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getTransactions({
        page,
        pageSize: 20,
      });

      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const from = data
    ? (data.page - 1) * data.pageSize + 1
    : 0;

  const to = data
    ? Math.min(data.page * data.pageSize, data.totalItems)
    : 0;

  return (
    <AppLayout>
      <h1 style={styles.heading}>Transactions</h1>

      <p style={styles.subheading}>
        Every transaction extracted from your invoices, with AI-assigned categories.
      </p>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Confidence</th>
              <th style={styles.thRight}>Amount</th>
            </tr>
          </thead>

          <tbody>
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} style={styles.emptyCell}>
                  No transactions yet — upload an invoice to get started.
                </td>
              </tr>
            )}

            {data?.items.map((t) => (
              <tr key={t.id} style={styles.row}>
                <td style={styles.td}>
                  {t.transactionDate}
                </td>

                <td style={styles.td}>
                  {t.description}
                </td>

                <td style={styles.td}>
                  <CategoryCell
                    transaction={t}
                    onUpdated={(updated) => {
                      setData((prev) => {
                        if (!prev) return prev;

                        return {
                          ...prev,
                          items: prev.items.map((item) =>
                            item.id === updated.id
                              ? {
                                  ...item,
                                  category: updated.category,
                                  categoryConfidence:
                                    updated.categoryConfidence,
                                  overriddenByUser:
                                    updated.overriddenByUser,
                                }
                              : item
                          ),
                        };
                      });
                    }}
                  />
                </td>

                <td style={styles.td}>
                  {t.categoryConfidence != null ? (
                    <div style={styles.confidenceWrap}>
                      <div style={styles.confidenceTrack}>
                        <div
                          style={{
                            ...styles.confidenceFill,
                            width: `${Math.round(
                              t.categoryConfidence * 100
                            )}%`,
                            backgroundColor: confidenceColor(
                              t.categoryConfidence
                            ),
                          }}
                        />
                      </div>

                      <span style={styles.confidenceLabel}>
                        {Math.round(
                          t.categoryConfidence * 100
                        )}
                        %
                      </span>
                    </div>
                  ) : (
                    <span style={styles.uncategorized}>
                      —
                    </span>
                  )}
                </td>

                <td style={styles.tdRight}>
                  ${t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && (
          <div style={styles.footer}>
            <span style={styles.footerText}>
              Showing{' '}
              {data.totalItems === 0 ? 0 : from}
              {' '}to{' '}
              {to}
              {' '}of{' '}
              {data.totalItems} transactions
            </span>

            <div style={styles.pagerButtons}>
              <button
                disabled={page <= 1}
                onClick={() =>
                  setPage((p) => p - 1)
                }
                style={styles.pagerButton}
              >
                Prev
              </button>

              <button
                disabled={page >= data.totalPages}
                onClick={() =>
                  setPage((p) => p + 1)
                }
                style={styles.pagerButton}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const styles = {
  heading: {
    color: theme.colors.inkBase,
    fontFamily: theme.fonts.display,
    fontSize: '24px',
    margin: 0,
  },

  subheading: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    marginTop: '4px',
    marginBottom: '24px',
  },

  tableCard: {
    backgroundColor: theme.colors.white,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: theme.fonts.body,
  },

  th: {
    textAlign: 'left',
    padding: '12px 20px',
    fontSize: '11px',
    color: theme.colors.textMuted,
    borderBottom: `1px solid ${theme.colors.border}`,
  },

  thRight: {
    textAlign: 'right',
    padding: '12px 20px',
    fontSize: '11px',
    color: theme.colors.textMuted,
    borderBottom: `1px solid ${theme.colors.border}`,
  },

  row: {
    borderBottom: `1px solid ${theme.colors.border}`,
  },

  td: {
    padding: '14px 20px',
    fontSize: '14px',
    color: theme.colors.inkBase,
  },

  tdRight: {
    padding: '14px 20px',
    fontSize: '14px',
    color: theme.colors.inkBase,
    textAlign: 'right',
    fontFamily: theme.fonts.mono,
  },

  categoryBadge: {
    backgroundColor: theme.colors.surfaceWash,
    color: theme.colors.primaryEmerald,
    padding: '3px 10px',
    borderRadius: theme.radius.sm,
    fontSize: '12px',
    fontWeight: 600,
  },

  overrideTag: {
    fontWeight: 400,
    fontStyle: 'italic',
    opacity: 0.8,
  },

  categoryButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  },

  categorySelect: {
    padding: '4px 8px',
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    fontSize: '13px',
    fontFamily: theme.fonts.body,
    backgroundColor: theme.colors.white,
  },

  inlineError: {
    fontSize: '11px',
    color: theme.colors.error,
    marginTop: '4px',
  },

  uncategorized: {
    fontSize: '13px',
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },

  confidenceWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  confidenceTrack: {
    width: '60px',
    height: '5px',
    backgroundColor: theme.colors.border,
    borderRadius: '3px',
    overflow: 'hidden',
  },

  confidenceFill: {
    height: '100%',
    borderRadius: '3px',
  },

  confidenceLabel: {
    fontSize: '12px',
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },

  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: '14px',
  },

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: theme.colors.surfaceWash,
  },

  footerText: {
    fontSize: '13px',
    color: theme.colors.textMuted,
  },

  pagerButtons: {
    display: 'flex',
    gap: '8px',
  },

  pagerButton: {
    padding: '6px 14px',
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.white,
    cursor: 'pointer',
    fontSize: '13px',
    color: theme.colors.inkBase,
  },
};

export default TransactionsPage;