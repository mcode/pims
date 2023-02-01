const express = require('express')
const doctorOrders = require("./routes/doctorOrders");
const app = express()
const port = process.env.PORT || 5051; 
const cors = require("cors");

//middleware and configurations 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));


app.use(cors(['http://localhost:3000/', 'http://localhost:3008/']));
app.listen(port, () => console.log(`Listening on port ${port}`));


app.use('/doctorOrders',  doctorOrders);