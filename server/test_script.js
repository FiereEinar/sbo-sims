const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/22025').then(async () => {
    const cats = await mongoose.connection.collection('categories').find({}).toArray();
    console.log('Categories:', cats.map(c => c.name));
    if (cats.length > 0) {
        const orgId = cats[0].organization;
        const org = await mongoose.connection.collection('organizations').findOne({_id: orgId});
        console.log('Org ID:', orgId, 'Org:', org ? org.name : 'null');
        
        // Let's try matching strings
        const orgs = await mongoose.connection.collection('organizations').find({}).toArray();
        console.log('All Orgs:', orgs.map(o => ({ id: o._id, name: o.name, depts: o.departments })));
    }
    mongoose.disconnect();
});
