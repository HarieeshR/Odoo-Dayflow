import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  totalDays: { type: Number, required: true },
  usedDays: { type: Number, default: 0 },
  year: { type: Number, required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

leaveBalanceSchema.virtual('remainingDays').get(function() {
  return this.totalDays - this.usedDays;
});

leaveBalanceSchema.index({ employee: 1, leaveType: 1, year: 1 }, { unique: true });

export default mongoose.model('LeaveBalance', leaveBalanceSchema);
