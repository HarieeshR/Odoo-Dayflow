import mongoose from 'mongoose';
import { publicMediaUrl } from '../utils/employeeUpdates.js';

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    trim: true,
    default: '-'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: String,
  profilePicture: String,
  department: String,
  designation: String,
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  location: String,
  joiningDate: Date,
  employmentStatus: {
    type: String,
    enum: ['active', 'inactive', 'probation', 'terminated'],
    default: 'active'
  },
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  nationality: String,
  personalEmail: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifsc: String
  },
  statutory: {
    pan: String,
    uan: String,
    employeeCode: String
  },
  aboutMe: {
    type: String,
    trim: true,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.profilePhoto = ret.profilePicture || '';
      ret.profilePhotoUrl = publicMediaUrl(ret.profilePicture);
      ret.bankName = ret.bankDetails?.bankName || '';
      ret.accountNumber = ret.bankDetails?.accountNumber || '';
      ret.ifsc = ret.bankDetails?.ifsc || '';
      ret.pan = ret.statutory?.pan || '';
      ret.uan = ret.statutory?.uan || '';
      ret.employeeCode = ret.statutory?.employeeCode || '';
      ret.status = ret.employmentStatus;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
