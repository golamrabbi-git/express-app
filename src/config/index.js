import 'dotenv/config';

export default {
  port: process.env.PORT || 5050,
  env: process.env.NODE_ENV || 'development',
};
