import mongoose from 'mongoose';

const serviceMasterSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  businessId: { 
    type: String, 
    required: true,
    index: true 
  },
  name: { type: String, required: true, trim: true }, // Ej: "Corte de pelo Premium"
  description: { type: String },
  category: { type: String }, // Ej: "Estética", "Mantenimiento"
  
  // DATOS FISCALES DE SERVICIO
  fiscalData: {
    satKey: { type: String, default: '82101500', ref: 'SatCatalog' }, // Clave de servicios genérica
    satUnitKey: { type: String, default: 'E48', ref: 'SatUnitCatalog' }, // 'E48' es la clave SAT para "Unidad de servicio"
    defaultTaxRate: { type: Number, default: 0.16 }
  },

  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

const ServiceMaster = mongoose.model('ServiceMaster', serviceMasterSchema);
export default ServiceMaster;