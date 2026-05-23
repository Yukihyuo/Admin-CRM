import mongoose from 'mongoose';

const extraChargeSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  businessId: { type: String, required: true, index: true },
  
  // EL "NOMBRE" DEL CARGO
  name: { type: String, required: true }, // Ej: "Envío Estafeta", "Honorarios"
  
  // CONFIGURACIÓN FISCAL (Lo único que no cambia)
  fiscalData: {
    satClaveProdServ: { type: String, required: true },
    satClaveUnidad: { type: String, default: 'E48' },
    taxRate: { type: Number, default: 0.16 }
  },

  // PREFERENCIA DE VISUALIZACIÓN (Opcional, para ayudar al cajero)
  suggestedLabel: { type: String }, // Ej: "¿Cuánto se cobró de guía?"
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ExtraCharge = mongoose.model('ExtraCharge', extraChargeSchema);
export default ExtraCharge;