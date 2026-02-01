/**
 * User Controller
 */
const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all users with search and pagination
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      whereClause += ` AND (u.username ILIKE $${params.length - 2} 
                        OR u.full_name ILIKE $${params.length - 1} 
                        OR u.email ILIKE $${params.length})`;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get users with role and department info
    params.push(limit, offset);
    const result = await query(
      `SELECT 
        u.id, u.username, u.full_name, u.email,
        u.is_active, u.last_login, u.created_at, u.updated_at,
        r.id as role_id, r.name as role_name, r.description as role_description,
        d.id as department_id, d.name as department_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.status(200).json({
      status: 'success',
      data: {
        users: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        u.id, u.username, u.full_name, u.email,
        u.is_active, u.last_login, u.created_at, u.updated_at,
        r.id as role_id, r.name as role_name,
        d.id as department_id, d.name as department_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, role_id, department_id, is_active } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      params.push(full_name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      params.push(email);
    }
    if (role_id !== undefined) {
      updates.push(`role_id = $${paramCount++}`);
      params.push(role_id);
    }
    if (department_id !== undefined) {
      updates.push(`department_id = $${paramCount++}`);
      params.push(department_id);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    // Get updated user
    const result = await query(
      `SELECT 
        u.id, u.username, u.full_name, u.email,
        u.is_active, u.last_login, u.created_at, u.updated_at,
        r.id as role_id, r.name as role_name,
        d.id as department_id, d.name as department_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [id]
    );

    logger.info(`User updated: ${id}`);

    res.status(200).json({
      status: 'success',
      data: { user: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const checkResult = await query('SELECT id FROM users WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [id]);

    logger.info(`User deleted: ${id}`);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
