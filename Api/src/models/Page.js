import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  name:{
    type: String,
    required: true,
    unique: true
  },
  path:{
    type: String,
    required: true,
    unique: true
  },
});

const Page = mongoose.model('Page', pageSchema);
export default Page;