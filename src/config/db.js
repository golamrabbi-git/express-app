import mongoose from 'mongoose';
import config from './index.js';
import User from '../models/user.model.js';
import Admin from '../models/admin.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import AdminRefreshToken from '../models/adminRefreshToken.model.js';

export const connectDB = async () => {
  if (!config.mongoUri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host} / ${name}`);
};

// Makes each collection's indexes match its schema: creates missing ones and drops ones
// the schema no longer defines (e.g. the old required-email index on users).
export const syncIndexes = async () => {
  for (const Model of [User, Admin, RefreshToken, AdminRefreshToken]) {
    const dropped = await Model.syncIndexes();
    if (dropped.length) console.log(`[db] ${Model.collection.name}: dropped outdated indexes ${dropped.join(', ')}`);
  }
};

export const disconnectDB = () => mongoose.disconnect();
