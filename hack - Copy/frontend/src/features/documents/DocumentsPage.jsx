import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as documentService from '../../services/documentService';
import { listItems, listTotalPages } from '../../utils/response';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';

const DocumentsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('other');
  const [employeeId, setEmployeeId] = useState('');

  // Filters & Pagination
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [page, typeFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10, type: typeFilter };
      let res;
      if (isAdmin) {
        res = await documentService.getAllDocuments(params);
      } else {
        res = await documentService.getMyDocuments(params);
      }
      if (res.success) {
        setDocuments(listItems(res.data));
        setTotalPages(listTotalPages(res.data));
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a file to upload.');
    if (!docName.trim()) return alert('Please provide a document name.');
    if (isAdmin && !employeeId.trim()) return alert('Please provide an Employee ID.');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', docName);
      formData.append('type', docType);
      if (isAdmin) formData.append('employeeId', employeeId);

      const res = await documentService.uploadDocument(formData);
      if (res.success) {
        alert('Document uploaded successfully!');
        setFile(null);
        setDocName('');
        setDocType('other');
        setEmployeeId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      } else {
        alert(res.message || 'Upload failed');
      }
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const blob = await documentService.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Download failed');
    }
  };

  const handleDeleteClick = (doc) => {
    setDocToDelete(doc);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      const res = await documentService.deleteDocument(docToDelete._id || docToDelete.id);
      if (res.success) {
        alert('Document deleted');
        fetchDocuments();
      } else {
        alert(res.message || 'Delete failed');
      }
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleteModalOpen(false);
      setDocToDelete(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h2>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <Input 
            label="Document Name" 
            value={docName} 
            onChange={(e) => setDocName(e.target.value)} 
            placeholder="e.g. Q3 Resume"
          />
          <Select 
            label="Document Type" 
            value={docType} 
            onChange={(e) => setDocType(e.target.value)}
            options={[
              { value: 'resume', label: 'Resume' },
              { value: 'certificate', label: 'Certificate' },
              { value: 'id_proof', label: 'ID Proof' },
              { value: 'medical', label: 'Medical' },
              { value: 'other', label: 'Other' },
            ]}
          />
          {isAdmin && (
            <Input 
              label="Employee ID" 
              value={employeeId} 
              onChange={(e) => setEmployeeId(e.target.value)} 
              placeholder="e.g. EMP-0002"
            />
          )}
          <div>
            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? <LoadingSpinner size="sm" /> : 'Upload'}
            </Button>
          </div>
        </form>
      </div>

      {/* Documents List Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Document List</h2>
          <div className="w-48">
            <Select 
              value={typeFilter} 
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              options={[
                { value: '', label: 'All Types' },
                { value: 'resume', label: 'Resume' },
                { value: 'certificate', label: 'Certificate' },
                { value: 'id_proof', label: 'ID Proof' },
                { value: 'medical', label: 'Medical' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner /></div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchDocuments} />
          ) : documents.length === 0 ? (
            <EmptyState message="No documents uploaded yet" />
          ) : (
            <>
              <Table 
                columns={[
                  { key: 'name', label: 'Name' },
                  { 
                    key: 'type', 
                    label: 'Type',
                    render: (val) => <Badge>{String(val || 'other').replace('_', ' ')}</Badge>
                  },
                  { 
                    key: 'fileSize', 
                    label: 'Size',
                    render: (val) => formatSize(val || 0)
                  },
                  { 
                    key: 'createdAt', 
                    label: 'Uploaded Date',
                    render: (val) => val ? new Date(val).toLocaleDateString() : '-'
                  },
                  { 
                    key: 'actions', 
                    label: 'Actions',
                    render: (_, doc) => (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(doc._id || doc.id)}>
                          Download
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteClick(doc)}>
                          Delete
                        </Button>
                      </div>
                    )
                  }
                ]}
                data={documents}
              />
              <div className="mt-4">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Document">
        <div className="p-4">
          <p>Are you sure you want to delete <strong>{docToDelete?.name}</strong>? This action cannot be undone.</p>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsPage;
