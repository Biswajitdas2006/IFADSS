import { useState, useRef } from 'react';
import { uploadInvoice } from '../services/invoiceService';
import AppLayout from '../components/layout/AppLayout';
import { theme } from '../styles/theme';

function InvoicesPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lastUploaded, setLastUploaded] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const result = await uploadInvoice(file);
      setLastUploaded(result);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <h1 style={styles.heading}>Invoices</h1>
      <p style={styles.subheading}>Upload an invoice to automatically extract and categorize transactions.</p>

      <div style={styles.uploadCard}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          style={styles.fileInput}
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={styles.button}
        >
          {uploading ? 'Uploading...' : 'Upload Invoice'}
        </button>

        {error && <div style={styles.errorBox}>{error}</div>}

        {lastUploaded && (
          <div style={styles.successBox}>
            Invoice uploaded — status: <strong>{lastUploaded.status}</strong> (ID: {lastUploaded.invoiceId})
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const styles = {
  heading: { color: theme.colors.inkBase, fontFamily: theme.fonts.display, fontSize: '24px', marginBottom: '4px' },
  subheading: { color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: '14px', marginBottom: '24px' },
  uploadCard: {
    backgroundColor: theme.colors.white,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: '24px',
    maxWidth: '500px',
  },
  fileInput: { display: 'block', marginBottom: '16px', fontFamily: theme.fonts.body, fontSize: '14px' },
  button: {
    padding: '10px 20px',
    borderRadius: theme.radius.sm,
    border: 'none',
    backgroundColor: theme.colors.primaryEmerald,
    color: theme.colors.white,
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  errorBox: {
    marginTop: '16px',
    backgroundColor: '#FDECEC',
    color: theme.colors.error,
    padding: '10px',
    borderRadius: theme.radius.sm,
    fontSize: '13px',
    border: `1px solid ${theme.colors.error}`,
  },
  successBox: {
    marginTop: '16px',
    backgroundColor: theme.colors.surfaceWash,
    color: theme.colors.primaryEmerald,
    padding: '10px',
    borderRadius: theme.radius.sm,
    fontSize: '13px',
  },
};

export default InvoicesPage;