import express from 'express';
import { login } from '#controllers/auth.controller';
import validate from '#middleware/validate';
import { loginSchema } from '#validations/auth.validation';

const router = express.Router();

// Here is the magic: First we validate, then we log in
router.post('/login', validate(loginSchema), login);

export default router;