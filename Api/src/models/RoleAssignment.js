import mongoose from "mongoose";

const roleAssignmentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  userId: {
    type: String,
    required: true,
    ref: 'Staff'
  },
  roleId: {
    type: String,
    required: true,
    ref: 'Role'
  },
  brandId: {
    type: String,
    required: true,
    ref: 'Brand'
  },
  scope: {
    type: { type: String, enum: ['brand', 'store'] },
    targetId: { type: String }
  }
});

const RoleAssignment = mongoose.model("RoleAssignment", roleAssignmentSchema);
export default RoleAssignment;