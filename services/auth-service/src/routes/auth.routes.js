import express from 'express';
import * as authController from '#controllers/auth.controller';
import { protect } from '#middleware/auth.middleware'; // Import protect
import validate from '#middleware/validate';
import { loginSchema, registerSchema } from '#validations/auth.validation';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// PROTECTED ROUTES
router.get('/me', protect, authController.getMe);

export default router;