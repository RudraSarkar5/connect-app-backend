import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/error_handler';
import User from '../model/user';

export const register = async (req: Request, res: Response , next:NextFunction) => {
      
    const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return next(
          new ErrorHandler(
            "Oops! Looks like something's missing. Fill in all fields, please",
            400
          )
        );
      }
  
      try {
       
        const user = await User.findOne({email});
        if(user){
            return next(
                new ErrorHandler(
                  "user already exist",
                  400
                )
              );
        }

        const userModel = await User.create({
            email,
            password,
            name
        })

        res.status(200).json({success:true,message:"account created successfully"})
      
      }catch{
        return next(new ErrorHandler(
            "Server Error",
            500
          ))
      }
  
     
  
}
    
 
  