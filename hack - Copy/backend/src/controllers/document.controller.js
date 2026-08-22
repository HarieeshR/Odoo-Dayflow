import * as documentService from '../services/document.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import path from 'path';

export const uploadDocument = asyncHandler(async (req, res) => {
  const type = req.body.type || 'other';
  let employeeRef = req.user.employee;
  if (req.user.role === 'admin' && req.body.employeeId) {
    employeeRef = req.body.employeeId;
  }
  if (!employeeRef) {
    throw Object.assign(new Error('Employee profile is required to upload documents'), { status: 400 });
  }
  const result = await documentService.uploadDocument(employeeRef, req.file, type, req.user._id, req.body.name);
  return successResponse(res, 'Document uploaded successfully', result, 201);
});

export const getMyDocuments = asyncHandler(async (req, res) => {
  const result = await documentService.getMyDocuments(req.user.employee, req.query);
  return successResponse(res, 'Documents fetched successfully', result);
});

export const getAllDocuments = asyncHandler(async (req, res) => {
  const result = await documentService.getAllDocuments(req.query);
  return successResponse(res, 'All documents fetched successfully', result);
});

export const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.getDocument(req.params.id, req.user._id, req.user.role);
  res.download(path.resolve(doc.filePath), doc.name);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.deleteDocument(req.params.id, req.user._id, req.user.role);
  return successResponse(res, 'Document deleted successfully');
});
