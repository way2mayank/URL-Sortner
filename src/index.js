const express=require("express")
const mongoose=require("mongoose")
const route=require("./route/route")
const app=express()

app.use(express.json())

mongoose.connect("mongodb+srv://Dishap:gn6kyXLuhnBE1EJK@cluster0.bwp65jf.mongodb.net/group40Database?retryWrites=true&w=majority",{useNewUrlParser:true})
.then(() => console.log("MongoDB is connected"))
.catch( err => console.log(err))

app.use('/', route);


app.listen(process.env.PORT||3000 , function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000 ))
});


