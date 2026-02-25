import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  pageId: {
    type: String,
    required: true,
    ref: 'Page'
  },
  type: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete']
  }
});

const Module = mongoose.model('Module', moduleSchema);
export default Module;