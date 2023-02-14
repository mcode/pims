const express = require('express')
const doctorOrders = require('./routes/doctorOrders');
const app = express();
const port = process.env.PORT || 5051;
const cors = require('cors');
const mongoose = require('mongoose');

//middleware and configurations 
const bodyParser = require('body-parser');


main().catch(err => console.log(err));

async function main() {

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cors(['http://localhost:3000/', 'http://localhost:3008/']));
    app.listen(port, () => console.log(`Listening on port ${port}`));
    app.use('/doctorOrders', doctorOrders);

    const mongoHost = process.env.MONGO_HOSTNAME ? process.env.MONGO_HOSTNAME : 'mongodb://localhost:27017/pims'

    await mongoose.connect(mongoHost, {
        authSource: 'admin',
        'user': process.env.MONGO_USERNAME ? process.env.MONGO_USERNAME : 'rems-admin-pims-root',
        'pass': process.env.MONGO_PASSWORD ? process.env.MONGO_PASSWORD : 'rems-admin-pims-password',
    });
}




