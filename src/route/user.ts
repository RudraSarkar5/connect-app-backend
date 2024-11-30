import { Router } from "express";
import { 
    register,
    login,
 } from "../controller/user";

const router= Router();

router.route('/sign_up').post(register);
router.route('/login').post(login);


export default router;