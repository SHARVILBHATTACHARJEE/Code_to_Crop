// Redis replaced with in-memory for simpler setup without Docker
const initRedis = async () => {
  console.log('Skipping Redis init (using in-memory features)');
};

module.exports = { initRedis };
