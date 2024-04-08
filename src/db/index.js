//database connection logic
 
 import mongoose from "mongoose";
 import { DB_Name } from '../constants.js';


 export const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env. DATABASE_URI}/${DB_Name}`)
        console.log("MongoDB connected")
        //    console.log("connection instance = ",connectionInstance.connection);
    }
    catch(err){
        console.log("Error in database Connection" + err);
        process.exit(1);
    }
 }