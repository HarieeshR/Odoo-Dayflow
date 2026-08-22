import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  name: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['resume', 'certificate', 'id_proof', 'medical', 'other'], 
    required: true 
  },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

documentSchema.index({ employee: 1, type: 1 });

export default mongoose.model('Document', documentSchema);
