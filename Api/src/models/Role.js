import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  brandId: {
    type: String,
    ref: 'Brand',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  permissions: {
    type: [{
      type: String,
      ref: 'Module'
    }],
    default: []
  }
});

// Índice compuesto para que el nombre sea único dentro de cada marca
roleSchema.index({ brandId: 1, name: 1 }, { unique: true });

const Role = mongoose.model("Role", roleSchema);
export default Role;