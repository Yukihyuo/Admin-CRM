import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  _id: {
    type: String,
    // Genera un ObjectId nuevo y lo convierte a string por defecto
    default: () => new mongoose.Types.ObjectId().toString()
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    // Sin `sparse` los usuarios sin email colisionarían entre sí por el valor nulo del índice
    sparse: true,
    trim: true,
    lowercase: true
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
    phone:{
      type: String,
      required: false
    }
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  // Los índices se reconcilian con syncIndexes() al arrancar la API, para poder
  // cambiar las opciones del índice de email en bases que ya existían.
  autoIndex: false
});

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;