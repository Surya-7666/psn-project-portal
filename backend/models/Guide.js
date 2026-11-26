const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Guide name is required'],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Guide', guideSchema);