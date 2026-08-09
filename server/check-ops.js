const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/transactionsdb_v2').then(async () => {
  const db = mongoose.connection.db;
  const ops = await db.collection('operationlogs').find({ status: { $in: ['pending', 'in_flight'] } }).toArray();
  console.log(JSON.stringify(ops, null, 2));
  process.exit(0);
});
