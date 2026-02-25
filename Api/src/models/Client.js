import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  _id: {
    type: String,
    // Genera un ObjectId nuevo y lo convierte a string por defecto
    default: () => new mongoose.Types.ObjectId().toString()
  },
  brandId: {
    type: String,
    required: true,
    ref: 'Brand'
  },
  storeId: { // La sucursal donde se registró físicamente por primera vez
    type: String,
    required: true,
    ref: 'Store'
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    names: {
      type: String,
      required: true
    },
    lastNames: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: false
    }
  },
  status: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);