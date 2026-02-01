/**
 * User Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');
const userController = require('../controllers/userController');

// All routes require authentication
router.use(authenticate);

// User routes - only admins can manage users
router.get('/', userController.getUsers);
router.get('/:id',  userController.getUserById);
router.put('/:id',  userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
