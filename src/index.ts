import express from "express";
import cors from "cors";
import { env_config } from "./configVariable/envConfig";
import user_route from './route/user';
import errorMiddleware from "./middleware/error";
import connectDB from "./db/db_config";
import http from "http";
import { WebSocketServer } from "ws";
import User from './model/user'; // Adjust the path to your user model

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1/user', user_route);
app.use(errorMiddleware);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });


interface UserType {
    email: string;
    latitude?: number;
    longitude?: number;
    active: boolean;
  }
  

  
  interface DistanceResult {
    miles: number;
    feet: number;
    yards: number;
    kilometers: number;
    meters: number;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R: number = 6371; // Radius of the earth in km
    const dLat: number = deg2rad(lat2 - lat1);  // deg2rad below
    const dLon: number = deg2rad(lon2 - lon1); 
    const a: number = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ; 
    const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d: number = R * c; // Distance in km
    return d * 1000;
  }
  
  
  

  
  // Function to find active users within a 10-meter radius
  const findNearbyUsers = async (email:string,lat: number, lon: number): Promise<string[]> => {
    try {
      const users: UserType[] = await User.find({ active: true }); // Get all active users
      const nearbyUsers:string[] = []; // List to store emails of nearby users
  
      users.forEach((user: UserType) => {
        if (user.latitude && user.longitude && user.email !== email ) {
           
            
            
            
            const distance = getDistanceFromLatLonInKm(lat,lon,user.latitude,user.longitude);
            console.log(`Distance: ${distance.toFixed(2)} meters`);
           
          
           nearbyUsers.push(user.email); 
        
        }
      });
  
      return nearbyUsers;
    } catch (err) {
      console.error('Error finding nearby users:', err);
      return [];
    }
  };
  

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    const dataString = message.toString(); // Convert the message to a string
     const data = JSON.parse(dataString);

    if (data.type === 'updateLocation') {
        const { email, lat, lng } = data;
        console.log("updated location...");
        console.log(`email: ${email}. latitude: ${lat}. longitude: ${lng}`);
  
        // Step 1: Update the user's location in the database
        await User.updateOne(
          { email },
          { latitude: lat, longitude: lng, active: true }
        );
  
        // Step 2: Find nearby active users within 10 meters
        const nearbyUsers = await findNearbyUsers(email,lat, lng);
  
        // Step 3: Send the list of nearby users back to the client
        // const responseMessage = {
        //   type: 'nearbyUsers',
        //   users: nearbyUsers // List of nearby user emails
        // };
  
        // Send the response back to the client (the one who sent the location update)
        // ws.send(JSON.stringify(responseMessage));
        console.log("the response messages for ",email," are : ",nearbyUsers);
        
    }
    

    if (data.type === 'close_connection') {
        const { email, lat, lng } = data;
        await User.updateOne({ email }, { latitude: lat, longitude: lng, active: false });
    }
  });

  ws.on('close', async () => {
    console.log('Client disconnected');

    // Handle user disconnection
    // Here we can track the user who disconnected and set their active status to false.
    // Assume we have some way to identify the user who disconnected
    // For example, store user email in the WebSocket object when they connect
    
  });
});

connectDB().then(() => {
  server.listen(env_config.PORT, () => {
    console.log(`Server is running at ${env_config.PORT}`);
  });
});
