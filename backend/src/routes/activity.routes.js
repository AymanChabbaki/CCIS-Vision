const express = require('express');
const router = express.Router();
const Joi = require('joi');
const activityController = require('../controllers/activityController');
const { authenticate, authorize } = require('../middleware/auth');const { canModify, canRead } = require('../middleware/authorize');const validate = require('../middleware/validate');

// Validation schemas
const createActivitySchema = Joi.object({
  activity_type_id: Joi.number().integer().required(),
  title: Joi.string().max(500).required(),
  description: Joi.string().allow(null, ''),
  start_date: Joi.date().required(),
  end_date: Joi.date().min(Joi.ref('start_date')).allow(null),
  registration_deadline: Joi.date().allow(null),
  location_id: Joi.number().integer().allow(null),
  venue_name: Joi.string().max(255).allow(null),
  venue_address: Joi.string().allow(null),
  is_online: Joi.boolean().default(false),
  max_participants: Joi.number().integer().allow(null),
  budget_allocated: Joi.number().allow(null),
  is_free: Joi.boolean().default(false),
  participation_fee: Joi.number().allow(null),
  status: Joi.string().valid('planned', 'ongoing', 'completed', 'cancelled').default('planned'),
  department_id: Joi.number().integer().allow(null),
});

const updateActivitySchema = Joi.object({
  activity_type_id: Joi.number().integer(),
  title: Joi.string().max(500),
  description: Joi.string().allow(null, ''),
  start_date: Joi.date(),
  end_date: Joi.date(),
  registration_deadline: Joi.date(),
  location_id: Joi.number().integer(),
  venue_name: Joi.string().max(255),
  venue_address: Joi.string(),
  is_online: Joi.boolean(),
  max_participants: Joi.number().integer(),
  budget_allocated: Joi.number(),
  is_free: Joi.boolean(),
  participation_fee: Joi.number(),
  status: Joi.string().valid('planned', 'ongoing', 'completed', 'cancelled'),
  department_id: Joi.number().integer(),
}).min(1);

// Routes
router.use(authenticate);

router.get('/',activityController.getActivities);
router.get('/export',  activityController.exportActivities);
router.get('/stats',  activityController.getActivityStats);
router.get('/:id',  activityController.getActivityById);
router.post('/',  validate(createActivitySchema), activityController.createActivity);
router.put('/:id',  validate(updateActivitySchema), activityController.updateActivity);
router.delete('/:id',  activityController.deleteActivity);

module.exports = router;
