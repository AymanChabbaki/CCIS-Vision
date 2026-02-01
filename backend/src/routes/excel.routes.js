const express = require('express');
const router = express.Router();
const Joi = require('joi');
const excelController = require('../controllers/excelController');
const { authenticate } = require('../middleware/auth');
const { canImport } = require('../middleware/authorize');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

// Validation schemas
const uploadSchema = Joi.object({
  entity_type: Joi.string().valid('company', 'activity', 'participant', 'budget').required(),
});

// Routes
router.use(authenticate);

router.post(
  '/upload',
  upload.single('file'),
  validate(uploadSchema),
  excelController.uploadExcelFile
);

router.get('/history', excelController.getImportHistory);

router.get('/:id', excelController.getImportDetails);

router.post('/:importId/validate', excelController.validateImport);

router.post('/:importId/process', excelController.processImport);

module.exports = router;
