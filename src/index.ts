import express from "express";
import { env_config } from "./configVariable/envConfig";
import user_route from './route/user'
import errorMiddleware from "./middleware/error";
import connectDB from "./db/db_config";


const app = express();

app.use(express.json());


app.use('/api/v1/user',user_route);

app.use(errorMiddleware);

connectDB().then(()=>{
    app.listen(env_config.PORT,()=>{
        console.log(`server is running at ${env_config.PORT}`);
        
    })
})






