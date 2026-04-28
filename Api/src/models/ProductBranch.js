import mongoose from 'mongoose';

const productBranchSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  masterProductId: { 
    type: String, 
    ref: 'MasterProduct', 
    required: true 
  },
  storeId: { // ID de la sucursal específica
    type: String, 
    required: true,
    index: true 
  },
  // OPERACIÓN LOCAL
  price: { type: Number, required: true, min: 0 }, // Precio en esta sucursal
  costPrice: { type: Number, default: 0 }, // Costo de adquisición local
  stock: { type: Number, default: 0 },
  lowStockAlert: { type: Number, default: 5 },
  
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { timestamps: true });

// Evita que una sucursal tenga duplicado el mismo producto maestro
productBranchSchema.index({ storeId: 1, masterProductId: 1 }, { unique: true });

const ProductBranch = mongoose.model('ProductBranch', productBranchSchema);
export default ProductBranch;