import express from 'express';
import * as authController from '#controllers/auth.controller';
import validate from '#middleware/validate';
import { loginSchema, registerSchema } from '#validations/auth.validation';

const router = express.Router();

// Public Routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

export default router;