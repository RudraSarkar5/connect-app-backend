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
  
  function calculateDistance(lat1: number, long1: number, lat2: number, long2: number): number {
    const deg2rad = (deg: number): number => deg * (Math.PI / 180);

    const theta = long1 - long2;

    // Calculate the distance in radians using the Haversine formula
    let dist = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) +
               Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));

    dist = Math.acos(Math.min(Math.max(dist, -1.0), 1.0)); // Ensure the value is within the range [-1, 1]
    dist = dist * (180 / Math.PI); // Convert radians to degrees

    // Convert degrees to distance in miles
    const miles = dist * 60 * 1.1515;

    // Convert miles to meters
    const kilometers = miles * 1.609344;
    const meters = kilometers * 1000;

    return meters;
}

  
  // Function to find active users within a 10-meter radius
  const findNearbyUsers = async (email:string,lat: number, lon: number): Promise<string[]> => {
    try {
      const users: UserType[] = await User.find({ active: true }); // Get all active users
      const nearbyUsers:string[] = []; // List to store emails of nearby users
  
      users.forEach((user: UserType) => {
        if (user.latitude && user.longitude && user.email !== email ) {
           
            
            
            
            const distance = calculateDistance(lat,lon,user.latitude,user.longitude);
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
