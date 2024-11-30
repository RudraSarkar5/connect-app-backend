import { Router } from "express";
import { register } from "../controller/user";

const router= Router();

router.route('/sign_up').post(register);


export default router;