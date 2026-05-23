import mongoose from 'mongoose';

const serviceBranchSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  masterServiceId: { 
    type: String, 
    ref: 'ServiceMaster', 
    required: true 
  },
  storeId: { 
    type: String, 
    required: true,
    index: true 
  },
  // OPERACIÓN LOCAL
  price: { type: Number, required: true, min: 0 }, 
  estimatedDuration: { type: Number }, // Minutos (útil para la agenda/calendario)
  
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { timestamps: true });

// Evita duplicados del mismo servicio en la misma sucursal
serviceBranchSchema.index({ storeId: 1, masterServiceId: 1 }, { unique: true });

const ServiceBranch = mongoose.model('ServiceBranch', serviceBranchSchema);
export default ServiceBranch;