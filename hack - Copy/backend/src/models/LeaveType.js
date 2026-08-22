import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  defaultDays: { type: Number, required: true },
  isPaid: { type: Boolean, default: true },
  requiresAttachment: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('LeaveType', leaveTypeSchema);
