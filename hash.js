const bcrypt = require('bcrypt');

async function run() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);

  console.log('admin:', adminHash);
  console.log('staff:', staffHash);
}

run();