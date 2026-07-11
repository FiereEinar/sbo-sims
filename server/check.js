const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/').then(async () => {
  const db = mongoose.connection.useDb('transactionsdb_v2');
  const reqs = await db.collection('paymentrequests').find({ receiptImage: { $exists: true, $ne: null } }).toArray();
  console.log(reqs.map(r => r.receiptImage));
  process.exit(0);
});
