import "dotenv/config";
import { connectDB } from "./db/index.js";
import {app} from './app.js'

connectDB()
  .then(()=>{
        app.use("error",(err)=>{console.log(err)})

         //listen 
          app.listen(process.env.PORT ,()=>{
             console.log(` Server is running on PORT ${process.env.PORT}`)
          })
    })
  .catch((err) => {
    console.log("connection  error", err);
  });


















// first approach connecting to database
// import express from "express";
// const app = express();

// (async()=>{
//     try{
//         await mongoose.connect(`${process.env. DATABASE_URI}/${DB_Name}`)

//         app.on("error",(err)=>{
//             console.log(err);
//             throw err;
//         })

//          app.listen(process.env.PORT , ()=>{
//             console.log(`listening on port ${process.env.PORT} `)
//          })

//     }
//      catch(err){
//         console.log(err)
//         throw err;
//      }

// })()
