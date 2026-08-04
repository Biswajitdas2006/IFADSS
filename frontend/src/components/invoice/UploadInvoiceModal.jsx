import { useState, useRef } from 'react';
import { uploadInvoice } from '../../services/invoiceService';
import { theme } from '../../styles/theme';

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function UploadInvoiceModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const validateAndSetFile = (selected) => {
    setError('');
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('File must be a PDF, JPG, or PNG.');
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError(`File size must not exceed ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleProcess = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const result = await uploadInvoice(file, (percent) => setProgress(percent));
      onUploaded(result);
      onClose();
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Upload failed. Please try again.';
      setError(message);
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Upload Invoice</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div
          style={{
            ...styles.dropzone,
            ...(dragActive ? styles.dropzoneActive : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <div style={styles.dropzoneText}>Drag and drop an invoice here</div>
          <div style={styles.dropzoneSubtext}>Supports PDF, JPG, PNG up to {MAX_SIZE_MB}MB</div>
          <button
            type="button"
            style={styles.browseButton}
            onClick={() => inputRef.current?.click()}
          >
            Browse Files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={(e) => validateAndSetFile(e.target.files[0])}
          />
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {file && (
          <div style={styles.fileRow}>
            <span style={styles.fileName}>{file.name}</span>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            <span style={styles.progressLabel}>{progress}%</span>
            {!uploading && (
              <button onClick={() => setFile(null)} style={styles.removeButton}>×</button>
            )}
          </div>
        )}

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelButton} disabled={uploading}>
            Cancel
          </button>
          <button
            onClick={handleProcess}
            disabled={!file || uploading}
            style={styles.processButton}
          >
            {uploading ? 'Processing…' : 'Process Invoice →'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(43,50,32,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: theme.colors.white, borderRadius: theme.radius.lg,
    width: '480px', boxShadow: theme.shadow.level2, fontFamily: theme.fonts.body,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: `1px solid ${theme.colors.border}`,
  },
  title: { fontFamily: theme.fonts.display, fontSize: '18px', color: theme.colors.inkBase, margin: 0 },
  closeButton: {
    background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: theme.colors.textMuted,
  },
  dropzone: {
    margin: '24px', padding: '32px 16px', border: `1.5px dashed ${theme.colors.border}`,
    borderRadius: theme.radius.md, textAlign: 'center', backgroundColor: theme.colors.surfaceWash,
  },
  dropzoneActive: { borderColor: theme.colors.primaryEmerald },
  dropzoneText: { fontWeight: 600, color: theme.colors.inkBase, marginBottom: '4px' },
  dropzoneSubtext: { fontSize: '13px', color: theme.colors.textMuted, marginBottom: '16px' },
  browseButton: {
    padding: '8px 16px', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.white, cursor: 'pointer', fontSize: '14px',
  },
  fileRow: {
    margin: '0 24px 16px', padding: '12px', border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.sm, display: 'flex', alignItems: 'center', gap: '10px',
  },
  fileName: { fontFamily: theme.fonts.mono, fontSize: '13px', color: theme.colors.inkBase, flexShrink: 0 },
  progressTrack: { flex: 1, height: '6px', backgroundColor: theme.colors.border, borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primaryEmerald, transition: 'width 0.2s' },
  progressLabel: { fontSize: '12px', color: theme.colors.textMuted, width: '32px' },
  removeButton: { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textMuted },
  errorBox: {
    margin: '0 24px 16px', backgroundColor: '#FDECEC', color: theme.colors.error,
    padding: '10px', borderRadius: theme.radius.sm, fontSize: '13px',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
    padding: '16px 24px', backgroundColor: theme.colors.surfaceWash,
    borderTop: `1px solid ${theme.colors.border}`, borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
  },
  cancelButton: {
    padding: '10px 18px', borderRadius: theme.radius.sm, border: 'none',
    background: 'none', color: theme.colors.secondarySlate, cursor: 'pointer', fontSize: '14px',
  },
  processButton: {
    padding: '10px 18px', borderRadius: theme.radius.sm, border: 'none',
    backgroundColor: theme.colors.primaryEmerald, color: theme.colors.white,
    fontWeight: 600, cursor: 'pointer', fontSize: '14px',
  },
};

export default UploadInvoiceModal;