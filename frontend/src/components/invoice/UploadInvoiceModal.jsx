import { useEffect, useRef, useState } from 'react';
import { FiFileText, FiUploadCloud, FiX } from 'react-icons/fi';
import { uploadInvoice } from '../../services/invoiceService';
import './invoice-modal.css';

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
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const uploadingRef = useRef(false);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !uploadingRef.current) closeRef.current();
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not(:disabled):not([tabindex="-1"]), input:not(:disabled):not([tabindex="-1"]), a[href]',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (
        document.activeElement === first ||
        document.activeElement === dialogRef.current
      )) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  const validateAndSetFile = (selected) => {
    setError('');
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Choose a PDF, JPG, or PNG file.');
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError(`File size must not exceed ${MAX_SIZE_MB} MB.`);
      return;
    }

    setFile(selected);
    setProgress(0);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    validateAndSetFile(event.dataTransfer.files[0]);
  };

  const handleProcess = async () => {
    if (!file) return;
    uploadingRef.current = true;
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const result = await uploadInvoice(file, setProgress);
      onUploaded(result);
      onClose();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message || 'Upload failed. Please try again.',
      );
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  return (
    <div
      className="invoice-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget && !uploading) onClose();
      }}
    >
      <section
        className="invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="invoice-modal-header">
          <div>
            <h2 id="invoice-modal-title">Upload an invoice</h2>
            <p>Choose a document to extract invoice details.</p>
          </div>
          <button
            className="invoice-modal-close"
            type="button"
            aria-label="Close upload dialog"
            onClick={onClose}
            disabled={uploading}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div
          className={`invoice-dropzone${dragActive ? ' is-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <span className="invoice-dropzone-icon" aria-hidden="true">
            {dragActive ? <FiUploadCloud /> : <FiFileText />}
          </span>
          <strong>{dragActive ? 'Drop the invoice to add it' : 'Drag an invoice here'}</strong>
          <span>PDF, JPG, or PNG · Maximum file size {MAX_SIZE_MB} MB</span>
          <button
            className="button-secondary"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            aria-label="Choose invoice file"
            tabIndex={-1}
            onChange={(event) => validateAndSetFile(event.target.files[0])}
            disabled={uploading}
          />
        </div>

        {error && <p className="invoice-modal-error" role="alert">{error}</p>}

        {file && (
          <div className="invoice-file-row">
            <div className="invoice-file-details">
              <FiFileText aria-hidden="true" />
              <span>{file.name}</span>
              <small>{(file.size / (1024 * 1024)).toFixed(2)} MB</small>
            </div>
            <div className="invoice-progress-row">
              <div
                className="invoice-progress-track"
                role="progressbar"
                aria-label="Invoice upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
              <span>{progress}%</span>
              {!uploading && (
                <button type="button" onClick={() => setFile(null)} aria-label="Remove selected file">
                  <FiX aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}

        <footer className="invoice-modal-footer">
          <button className="button-secondary" type="button" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button className="button" type="button" onClick={handleProcess} disabled={!file || uploading}>
            {uploading ? 'Uploading…' : 'Upload invoice'}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default UploadInvoiceModal;
