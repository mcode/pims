const express = require('express')
const doctorOrders = require("./routes/doctorOrders");
const app = express()
const port = process.env.PORT || 5051; 
const cors = require("cors");

//middleware and configurations 
app.use(cors());
app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: false }))

app.listen(port, () => console.log(`Listening on port ${port}`));

app.use('/doctorOrders',  doctorOrders);