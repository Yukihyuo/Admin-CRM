import mongoose from 'mongoose';

const satUnitCatalogSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  }, // La clave oficial del SAT (ej: "H87", "E48", "KGM")
  
  name: { 
    type: String, 
    required: true, 
    index: true 
  }, // El nombre oficial (ej: "Pieza", "Unidad de servicio", "Kilogramo")
  
  description: { 
    type: String 
  }, // Definición técnica que a veces provee el SAT
  
  symbol: { 
    type: String 
  }, // Símbolo opcional (ej: "kg", "m", "pc.")

  // Campos de utilidad para tu UI
  isCommon: { 
    type: Boolean, 
    default: false 
  } // Para que en tu frontend las claves como H87 y E48 salgan primero
}, { 
  timestamps: true,
  collection: 'sat_unit_catalog' // Nombre explícito para tu DB global
});

// Índice de texto para que el usuario busque "Kilo" y encuentre "Kilogramo"
satUnitCatalogSchema.index({ name: 'text', _id: 'text' });

const SatUnitCatalog = mongoose.model('SatUnitCatalog', satUnitCatalogSchema);
export default SatUnitCatalog;