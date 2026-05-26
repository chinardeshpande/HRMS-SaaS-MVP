import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface ViewableDocument {
  title: string;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  uploadedAt?: string | null;
  category?: string | null;
  status?: string | null;
  description?: string | null;
  metadata?: Array<{ label: string; value?: string | number | null }>;
}

interface DocumentViewerModalProps {
  document: ViewableDocument | null;
  loadBlob: (() => Promise<Blob>) | null;
  onClose: () => void;
  onDownload?: () => Promise<void> | void;
}

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];

const getExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || '';

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return 'Size unavailable';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentViewerModal({
  document,
  loadBlob,
  onClose,
  onDownload,
}: DocumentViewerModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPdfFallback, setShowPdfFallback] = useState(false);

  const extension = useMemo(() => getExtension(document?.fileName || ''), [document?.fileName]);
  const isPdf = mimeType === 'application/pdf' || extension === 'pdf';
  const isImage = mimeType.startsWith('image/') || imageExtensions.includes(extension);

  useEffect(() => {
    if (!document || !loadBlob) return;

    let mounted = true;
    let nextUrl: string | null = null;

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowPdfFallback(false);
        const blob = await loadBlob();
        if (!mounted) return;
        nextUrl = URL.createObjectURL(blob);
        setObjectUrl(nextUrl);
        setMimeType(blob.type || document.fileType || '');
      } catch (err) {
        console.error('Document preview error:', err);
        if (mounted) {
          setError('This document could not be loaded for preview.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      mounted = false;
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [document, loadBlob]);

  useEffect(() => {
    if (!objectUrl || !isPdf) {
      setShowPdfFallback(false);
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setShowPdfFallback(true);
    }, 2500);

    return () => window.clearTimeout(fallbackTimer);
  }, [objectUrl, isPdf]);

  useEffect(() => {
    if (!document) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [document, onClose]);

  if (!document) return null;

  const PreviewIcon = isImage ? PhotoIcon : isPdf ? DocumentTextIcon : DocumentIcon;
  const openPreviewInNewTab = () => {
    if (objectUrl) {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Document preview</p>
            <h2 className="mt-1 truncate text-lg font-bold text-gray-900">{document.title}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>{document.fileName}</span>
              <span>{formatFileSize(document.fileSize)}</span>
              {document.category && <span>{document.category}</span>}
              {document.status && <span>{document.status}</span>}
              {document.uploadedAt && <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-primary-700"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            )}
            {objectUrl && (
              <button
                type="button"
                onClick={openPreviewInNewTab}
                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-primary-700"
                title="Open preview"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              title="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_280px]">
          <main className="min-h-[55vh] overflow-auto bg-gray-100 p-4">
            {loading ? (
              <div className="flex h-full min-h-[420px] items-center justify-center text-sm font-semibold text-gray-500">
                Loading document preview...
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center text-gray-600">
                <PreviewIcon className="mb-4 h-16 w-16 text-gray-300" />
                <p className="font-semibold text-gray-900">Preview unavailable</p>
                <p className="mt-1 max-w-md text-sm">{error}</p>
              </div>
            ) : objectUrl && isImage ? (
              <div className="flex min-h-[420px] items-center justify-center">
                <img src={objectUrl} alt={document.title} className="max-h-[72vh] max-w-full rounded-lg bg-white object-contain shadow" />
              </div>
            ) : objectUrl && isPdf ? (
              <div className="space-y-3">
                {showPdfFallback && (
                  <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      If the PDF area stays blank, the embedded browser is blocking inline PDF rendering. Open or download the file.
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={openPreviewInNewTab}
                        className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                      >
                        Open
                      </button>
                      {onDownload && (
                        <button
                          type="button"
                          onClick={onDownload}
                          className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <object
                  data={objectUrl}
                  type="application/pdf"
                  className="h-[72vh] w-full rounded-lg border border-gray-200 bg-white shadow"
                >
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-lg bg-white p-8 text-center text-gray-600">
                    <DocumentTextIcon className="mb-4 h-16 w-16 text-gray-300" />
                    <p className="font-semibold text-gray-900">Inline PDF preview is not available in this browser.</p>
                    <p className="mt-1 max-w-md text-sm">Open or download the file to review it.</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={openPreviewInNewTab}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Open
                      </button>
                      {onDownload && (
                        <button
                          type="button"
                          onClick={onDownload}
                          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </object>
              </div>
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center text-gray-600">
                <PreviewIcon className="mb-4 h-16 w-16 text-gray-300" />
                <p className="font-semibold text-gray-900">Browser preview is not available for this file type.</p>
                <p className="mt-1 max-w-md text-sm">Use Download to open it with the correct desktop application.</p>
              </div>
            )}
          </main>

          <aside className="border-t border-gray-200 bg-white p-4 lg:border-l lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Document information</p>
            {document.description && <p className="mt-3 text-sm text-gray-700">{document.description}</p>}
            <dl className="mt-4 space-y-3">
              {(document.metadata || []).filter((item) => item.value !== undefined && item.value !== null && item.value !== '').map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-gray-800">{item.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
