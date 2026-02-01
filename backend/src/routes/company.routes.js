const express = require('express');
const router = express.Router();
const Joi = require('joi');
const companyController = require('../controllers/companyController');
const { authenticate } = require('../middleware/auth');
const { canModify, canRead } = require('../middleware/authorize');
const validate = require('../middleware/validate');

// Validation schemas
const createCompanySchema = Joi.object({
  name: Joi.string().max(500).required(),
  legal_name: Joi.string().max(500).allow(null),
  ice: Joi.string().max(50).allow(null),
  rc: Joi.string().max(100).allow(null),
  patent_number: Joi.string().max(100).allow(null),
  tax_id: Joi.string().max(100).allow(null),
  phone: Joi.string().max(50).allow(null),
  mobile: Joi.string().max(50).allow(null),
  email: Joi.string().email().allow(null),
  website: Joi.string().uri().allow(null),
  address: Joi.string().allow(null),
  city: Joi.string().max(100).allow(null),
  province: Joi.string().max(100).allow(null),
  postal_code: Joi.string().max(20).allow(null),
  company_type: Joi.string().max(100).allow(null),
  sector_id: Joi.number().integer().allow(null),
  size_category: Joi.string().max(50).allow(null),
  employee_count: Joi.number().integer().allow(null),
  annual_revenue: Joi.number().allow(null),
  representative_name: Joi.string().max(255).allow(null),
  representative_title: Joi.string().max(100).allow(null),
  representative_email: Joi.string().email().allow(null),
  representative_phone: Joi.string().max(50).allow(null),
  is_member: Joi.boolean().default(false),
  membership_date: Joi.date().allow(null),
  membership_status: Joi.string().max(50).allow(null),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
});

const updateCompanySchema = Joi.object({
  name: Joi.string().max(500),
  legal_name: Joi.string().max(500),
  ice: Joi.string().max(50),
  rc: Joi.string().max(100),
  patent_number: Joi.string().max(100),
  tax_id: Joi.string().max(100),
  phone: Joi.string().max(50),
  mobile: Joi.string().max(50),
  email: Joi.string().email(),
  website: Joi.string().uri(),
  address: Joi.string(),
  city: Joi.string().max(100),
  province: Joi.string().max(100),
  postal_code: Joi.string().max(20),
  company_type: Joi.string().max(100),
  sector_id: Joi.number().integer(),
  size_category: Joi.string().max(50),
  employee_count: Joi.number().integer(),
  annual_revenue: Joi.number(),
  representative_name: Joi.string().max(255),
  representative_title: Joi.string().max(100),
  representative_email: Joi.string().email(),
  representative_phone: Joi.string().max(50),
  is_member: Joi.boolean(),
  membership_date: Joi.date(),
  membership_status: Joi.string().max(50),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
}).min(1);

const mergeCompaniesSchema = Joi.object({
  keepId: Joi.string().uuid().required(),
  mergeIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

// Routes
router.use(authenticate);

router.get('/',  companyController.getCompanies);
router.get('/stats',  companyController.getCompanyStats);
router.get('/export',  companyController.exportCompanies);
router.get('/duplicates',  companyController.findDuplicates);
router.post('/merge',  validate(mergeCompaniesSchema), companyController.mergeCompanies);
router.get('/:id',  companyController.getCompanyById);
router.post('/',  validate(createCompanySchema), companyController.createCompany);
router.put('/:id',  validate(updateCompanySchema), companyController.updateCompany);
router.delete('/:id',  companyController.deleteCompany);

module.exports = router;
