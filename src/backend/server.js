const express = require('express')
const doctorOrders = require("./routes/doctorOrders");
const app = express()
const port = process.env.PORT || 5051;
const cors = require("cors");
const mongoose = require('mongoose');

//middleware and configurations 
const bodyParser = require("body-parser");


main().catch(err => console.log(err));

async function main() {

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cors(['http://localhost:3000/', 'http://localhost:3008/']));
    app.listen(port, () => console.log(`Listening on port ${port}`));
    app.use('/doctorOrders', doctorOrders);

    await mongoose.connect("mongodb://pims_remsadmin_mongo:27017/pims", {
        authSource: "admin",
        "user": "rems-admin-pims-root",
        "pass": "rems-admin-pims-password",
    });
}




