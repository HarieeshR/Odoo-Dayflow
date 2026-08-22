import { useEffect, useState } from "react";
import { FileText, Download, Eye, Plus } from "lucide-react";
import * as api from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  StatusBadge, TableSkeleton, EmptyState, ErrorState, Modal, PrimaryButton, SecondaryButton, AmberButton,
} from "../components/ui";

const REQUEST_TYPES = ["Offer Letter", "Appointment Letter", "Experience Letter", "Salary Certificate", "Salary Slip", "Address Proof", "Other"];

export default function Documents() {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewDoc, setViewDoc] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [form, setForm] = useState({ type: REQUEST_TYPES[0], remarks: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, r] = await Promise.all([api.getMyDocuments(), api.getMyDocumentRequests()]);
      setDocs(d);
      setRequests(r);
    } catch (e) {
      setError(e.message || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = (doc) => {
    toast.success(`Downloading "${doc.name}"…`);
  };

  const submitRequest = async () => {
    setSubmitting(true);
    try {
      await api.requestDocument(form);
      toast.success("Document request submitted.");
      setRequestOpen(false);
      setForm({ type: REQUEST_TYPES[0], remarks: "" });
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-500">Only your own documents are shown here.</p>
        <AmberButton onClick={() => setRequestOpen(true)}><Plus size={15} /> Request Document</AmberButton>
      </div>

      {/* Documents list */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-navy-900/[0.06]">
          <h3 className="font-display font-semibold text-navy-900">My Documents</h3>
        </div>
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : docs.length === 0 ? (
          <EmptyState title="No documents available." icon={FileText} />
        ) : (
          <div className="divide-y divide-navy-900/[0.06]">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center shrink-0">
                  <FileText size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{doc.name}</p>
                  <p className="text-xs text-navy-500">{doc.type} · {doc.date}</p>
                </div>
                <StatusBadge status={doc.status} />
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setViewDoc(doc)} className="p-2 rounded-lg hover:bg-navy-900/[0.05] text-navy-600" aria-label="View">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleDownload(doc)} className="p-2 rounded-lg hover:bg-navy-900/[0.05] text-navy-600" aria-label="Download">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document requests */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-navy-900/[0.06]">
          <h3 className="font-display font-semibold text-navy-900">My Requests</h3>
        </div>
        {loading ? (
          <TableSkeleton rows={2} cols={4} />
        ) : requests.length === 0 ? (
          <EmptyState title="No document requests yet." description="Request a document using the button above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-navy-500 uppercase tracking-wide bg-navy-900/[0.02]">
                  <th className="px-5 py-3">Request ID</th>
                  <th className="px-5 py-3">Document Type</th>
                  <th className="px-5 py-3">Remarks</th>
                  <th className="px-5 py-3">Requested On</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/[0.06]">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-mono text-xs text-navy-700">{r.id}</td>
                    <td className="px-5 py-3 font-medium text-navy-900">{r.type}</td>
                    <td className="px-5 py-3 text-navy-600 max-w-[220px] truncate">{r.remarks || "—"}</td>
                    <td className="px-5 py-3 text-navy-600">{r.requestedOn}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View modal */}
      <Modal open={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc?.name}>
        <div className="aspect-[4/5] rounded-xl bg-navy-900/[0.03] border border-dashed border-navy-900/15 flex flex-col items-center justify-center gap-2 text-navy-400">
          <FileText size={32} />
          <p className="text-sm">Document preview</p>
          <p className="text-xs">{viewDoc?.type} · {viewDoc?.date}</p>
        </div>
      </Modal>

      {/* Request modal */}
      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request a Document"
        footer={
          <>
            <SecondaryButton onClick={() => setRequestOpen(false)}>Cancel</SecondaryButton>
            <AmberButton onClick={submitRequest} loading={submitting}>Submit Request</AmberButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Document Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              {REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              rows={3}
              placeholder="Why do you need this document? (optional)"
              className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
