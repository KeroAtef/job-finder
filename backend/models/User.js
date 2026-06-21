const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  subscriptionActive: { type: Boolean, default: true },
  subscriptionStart: { type: Date, default: Date.now },
  subscriptionEnd: { type: Date, default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) },
  cvData: { type: mongoose.Schema.Types.Mixed, default: null },
  tracker: { type: [mongoose.Schema.Types.Mixed], default: [] },
  stories: { type: [mongoose.Schema.Types.Mixed], default: [] },
  savedSearches: { type: [mongoose.Schema.Types.Mixed], default: [] },
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.isSubscriptionValid = function () {
  return this.subscriptionActive && new Date() < new Date(this.subscriptionEnd);
};

module.exports = mongoose.model('User', userSchema);
