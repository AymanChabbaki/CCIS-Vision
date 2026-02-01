const express = require('express');
const router = express.Router();
const Joi = require('joi');
const alertController = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation schemas
const createAlertSchema = Joi.object({
  alert_type_id: Joi.number().integer().required(),
  severity: Joi.string().valid('info', 'warning', 'critical').required(),
  title: Joi.string().max(500).required(),
  message: Joi.string().required(),
  entity_type: Joi.string().max(100).allow(null),
  entity_id: Joi.string().uuid().allow(null),
  threshold_value: Joi.number().allow(null),
  current_value: Joi.number().allow(null),
});

const updateAlertStatusSchema = Joi.object({
  is_read: Joi.boolean().required(),
});

// Routes
router.use(authenticate);

router.get('/', alertController.getAlerts);
router.get('/stats',  alertController.getAlertStats);
router.post('/',  validate(createAlertSchema), alertController.createAlert);
router.post('/trigger-checks',  alertController.triggerAlertChecks);
router.put('/:id/status',  validate(updateAlertStatusSchema), alertController.updateAlertStatus);
router.delete('/:id',  alertController.deleteAlert);
module.exports = router;
