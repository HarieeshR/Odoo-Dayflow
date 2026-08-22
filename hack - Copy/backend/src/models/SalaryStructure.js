import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['fixed', 'percentage'], required: true },
  value: { type: Number, required: true },
  baseComponent: { type: String },
  calculatedAmount: { type: Number }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['fixed', 'percentage'], required: true },
  value: { type: Number, required: true },
  baseComponent: { type: String, default: 'totalEarnings' },
  calculatedAmount: { type: Number }
}, { _id: false });

const salaryStructureSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
  monthlyWage: { type: Number, required: true },
  components: [componentSchema],
  deductions: [deductionSchema],
  totalEarnings: { type: Number },
  totalDeductions: { type: Number },
  netSalary: { type: Number },
  effectiveDate: { type: Date, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('SalaryStructure', salaryStructureSchema);
