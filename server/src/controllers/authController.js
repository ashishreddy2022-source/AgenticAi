import { AuthService } from '../services/authService.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const result = await AuthService.register({ name, email, password, role });
      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}
