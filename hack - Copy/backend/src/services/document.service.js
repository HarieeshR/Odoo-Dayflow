import Document from '../models/Document.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';
import * as auditService from './audit.service.js';
import fs from 'fs';
import { idOf } from '../utils/dates.js';
import { paginatedData } from '../utils/apiResponse.js';

const resolveEmployee = async (employeeId) => {
  const value = idOf(employeeId);
  if (!value) return null;
  const asString = String(value);
  if (mongoose.isValidObjectId(asString)) {
    const byId = await Employee.findById(asString);
    if (byId) return byId;
  }
  return Employee.findOne({ employeeId: asString });
};

export const uploadDocument = async (employeeId, fileData, type, uploadedByUserId, originalName) => {
  if (!fileData) {
    throw new Error('No file provided');
  }

  const employee = await resolveEmployee(employeeId);
  if (!employee) throw new Error('Employee not found');

  const doc = await Document.create({
    employee: employee._id,
    name: originalName || fileData.originalname,
    type,
    filePath: fileData.path,
    fileSize: fileData.size,
    mimeType: fileData.mimetype,
    uploadedBy: uploadedByUserId
  });

  await auditService.createAuditLog({
    actorId: uploadedByUserId,
    action: 'DOCUMENT_UPLOAD',
    entityType: 'Document',
    entityId: doc._id,
    newValue: { type, name: doc.name }
  });

  return doc;
};

export const getMyDocuments = async (employeeId, { type, page = 1, limit = 10 }) => {
  const filter = { employee: idOf(employeeId) };
  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    Document.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Document.countDocuments(filter)
  ]);

  const pagination = { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) };
  return paginatedData('documents', documents, pagination);
};

export const getAllDocuments = async ({ search, type, page = 1, limit = 10 }) => {
  let employeeFilter = {};
  if (search) {
    employeeFilter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }

  const filter = {};
  if (Object.keys(employeeFilter).length > 0) {
    const employees = await Employee.find(employeeFilter).select('_id');
    filter.employee = { $in: employees.map(e => e._id) };
  }
  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    Document.find(filter).populate('employee', 'firstName lastName employeeId department').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Document.countDocuments(filter)
  ]);

  return paginatedData('documents', documents, { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) });
};

export const getDocument = async (documentId, requestingUserId, requestingUserRole) => {
  const doc = await Document.findById(documentId).populate('employee');
  if (!doc) throw new Error('Document not found');

  if (requestingUserRole !== 'admin' && doc.employee.user.toString() !== requestingUserId.toString()) {
    throw new Error('Forbidden: You can only access your own documents');
  }

  return doc;
};

export const deleteDocument = async (documentId, requestingUserId, requestingUserRole) => {
  const doc = await Document.findById(documentId).populate('employee');
  if (!doc) throw new Error('Document not found');

  if (requestingUserRole !== 'admin' && doc.employee.user.toString() !== requestingUserId.toString()) {
    throw new Error('Forbidden: You can only delete your own documents');
  }

  if (fs.existsSync(doc.filePath)) {
    fs.unlinkSync(doc.filePath);
  }

  await Document.deleteOne({ _id: documentId });

  await auditService.createAuditLog({
    actorId: requestingUserId,
    action: 'DOCUMENT_DELETE',
    entityType: 'Document',
    entityId: doc._id,
    oldValue: { type: doc.type, name: doc.name }
  });

  return doc;
};
