import mongoose from 'mongoose';

const satProductServiceSchema = new mongoose.Schema({
  _id: String, // La clave de 8 dígitos, ej: "10111512"
  description: String, // "Galletas"
  includeIVA: Boolean, // Opcional, para saber si suele llevar impuesto
  isService: Boolean,  // Para ayudar al UI a sugerir unidades
}, {
  timestamps: true,
  collection: 'sat_catalog' // Nombre explícito para tu DB global
});

const SatProductService = mongoose.model('SatCatalog', satProductServiceSchema);
export default SatProductService;