/**
 * Transaction Routes for MLG.clan API
 * 
 * Routes for blockchain transaction tracking, confirmation,
 * and transaction management.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import express from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { validate, schemas } from '../middleware/validation.middleware.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * GET /api/transactions
 * Get user transactions with filtering
 * 
 * @header {string} Authorization - Bearer access token
 * @query {string} [transactionType] - Transaction type filter
 * @query {string} [status] - Status filter
 * @query {string} [walletAddress] - Wallet address filter (admin only)
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 * @query {string} [startDate] - Start date filter
 * @query {string} [endDate] - End date filter
 * @query {number} [minAmount] - Minimum amount filter
 * @query {number} [maxAmount] - Maximum amount filter
 * @query {string} [sortBy=created_at] - Sort field
 * @query {string} [sortOrder=desc] - Sort order
 * @returns {object} Transactions list with pagination
 */
router.get('/',
  authMiddleware,
  rateLimiterMiddleware('user'),
  validate(schemas.transaction.search, 'query'),
  TransactionController.getUserTransactions
);

/**
 * GET /api/transactions/pending
 * Get pending transactions for current user
 * 
 * @header {string} Authorization - Bearer access token
 * @query {number} [limit=10] - Number of results
 * @returns {object} Pending transactions list
 */
router.get('/pending',
  authMiddleware,
  rateLimiterMiddleware('user'),
  TransactionController.getPendingTransactions
);

/**
 * GET /api/transactions/stats
 * Get transaction statistics
 * 
 * @header {string} Authorization - Bearer access token
 * @query {string} [period=30d] - Statistics period
 * @query {string} [walletAddress] - Wallet address filter (admin only)
 * @query {string} [transactionType] - Transaction type filter
 * @returns {object} Transaction statistics
 */
router.get('/stats',
  authMiddleware,
  rateLimiterMiddleware('user'),
  TransactionController.getTransactionStats
);

/**
 * GET /api/transactions/global-stats
 * Get global transaction statistics (admin only)
 * 
 * @header {string} Authorization - Bearer access token
 * @query {string} [period=30d] - Statistics period
 * @returns {object} Global transaction statistics
 */
router.get('/global-stats',
  authMiddleware,
  requireRole('admin'),
  rateLimiterMiddleware('user'),
  TransactionController.getGlobalTransactionStats
);

/**
 * POST /api/transactions/confirm
 * Confirm blockchain transaction
 * 
 * @header {string} Authorization - Bearer access token
 * @body {string} signature - Transaction signature
 * @body {string} transactionType - Transaction type
 * @body {number} [amount] - Transaction amount
 * @body {object} [metadata] - Additional metadata
 * @returns {object} Transaction confirmation data
 */
router.post('/confirm',
  authMiddleware,
  rateLimiterMiddleware('user'),
  validate(schemas.transaction.confirm),
  TransactionController.confirmTransaction
);

/**
 * GET /api/transactions/:signature
 * Get transaction by signature
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} signature - Transaction signature
 * @returns {object} Transaction details
 */
router.get('/:signature',
  authMiddleware,
  rateLimiterMiddleware('user'),
  TransactionController.getTransactionBySignature
);

/**
 * POST /api/transactions/:id/cancel
 * Cancel pending transaction
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Transaction ID
 * @body {string} [reason] - Cancellation reason
 * @returns {object} Cancellation confirmation
 */
router.post('/:id/cancel',
  authMiddleware,
  rateLimiterMiddleware('user'),
  TransactionController.cancelTransaction
);

/**
 * POST /api/transactions/:id/retry
 * Retry failed transaction processing (admin only)
 * 
 * @header {string} Authorization - Bearer access token
 * @param {string} id - Transaction ID
 * @returns {object} Retry confirmation
 */
router.post('/:id/retry',
  authMiddleware,
  requireRole('admin'),
  rateLimiterMiddleware('user'),
  TransactionController.retryTransaction
);

/**
 * Additional utility routes for transaction management
 */

/**
 * GET /api/transactions/type/:type
 * Get transactions by specific type
 */
router.get('/type/:type',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { type } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      
      const transactionDAO = req.services.userRepository?.transactionDAO || 
                            req.services.clanRepository?.transactionDAO;
      
      if (!transactionDAO) {
        return res.status(500).json({
          error: 'Transaction service unavailable',
          code: 'SERVICE_ERROR'
        });
      }
      
      const transactions = await transactionDAO.findMany({
        conditions: {
          user_id: req.user.id,
          transaction_type: type,
          ...(status && { status })
        },
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: [['created_at', 'desc']]
      });
      
      res.status(200).json({
        success: true,
        data: {
          transactions,
          type,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: transactions.length,
            hasMore: transactions.length === parseInt(limit)
          }
        },
        message: `${type} transactions retrieved successfully`
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/transactions/clan/:clanId
 * Get transactions for specific clan (clan members only)
 */
router.get('/clan/:clanId',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { clanId } = req.params;
      const { page = 1, limit = 20, transactionType, status } = req.query;
      
      // Check if user is a clan member
      const clanRepository = req.services.clanRepository;
      if (!clanRepository) {
        return res.status(500).json({
          error: 'Clan service unavailable',
          code: 'SERVICE_ERROR'
        });
      }
      
      const membership = await clanRepository.clanDAO.getMembership(clanId, req.user.id);
      if (!membership && !req.user.roles?.includes('admin')) {
        return res.status(403).json({
          error: 'Clan membership required',
          code: 'NOT_CLAN_MEMBER',
          message: 'You must be a clan member to view clan transactions'
        });
      }
      
      const transactionDAO = clanRepository.transactionDAO;
      
      const transactions = await transactionDAO.findMany({
        conditions: {
          clan_id: clanId,
          ...(transactionType && { transaction_type: transactionType }),
          ...(status && { status })
        },
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: [['created_at', 'desc']]
      });
      
      res.status(200).json({
        success: true,
        data: {
          transactions,
          clanId,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: transactions.length,
            hasMore: transactions.length === parseInt(limit)
          }
        },
        message: 'Clan transactions retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/transactions/summary/monthly
 * Get monthly transaction summary for user
 */
router.get('/summary/monthly',
  authMiddleware,
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { year = new Date().getFullYear(), months = 12 } = req.query;
      
      const transactionDAO = req.services.userRepository?.transactionDAO || 
                            req.services.clanRepository?.transactionDAO;
      
      if (!transactionDAO) {
        return res.status(500).json({
          error: 'Transaction service unavailable',
          code: 'SERVICE_ERROR'
        });
      }
      
      const monthlySummary = await transactionDAO.getMonthlySummary(
        req.user.id,
        parseInt(year),
        parseInt(months)
      );
      
      res.status(200).json({
        success: true,
        data: {
          summary: monthlySummary,
          year: parseInt(year),
          months: parseInt(months)
        },
        message: 'Monthly transaction summary retrieved successfully'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/transactions/bulk-confirm
 * Bulk confirm multiple transactions (admin only)
 */
router.post('/bulk-confirm',
  authMiddleware,
  requireRole('admin'),
  rateLimiterMiddleware('user'),
  async (req, res, next) => {
    try {
      const { signatures } = req.body;
      
      if (!Array.isArray(signatures) || signatures.length === 0) {
        return res.status(400).json({
          error: 'Invalid signatures array',
          code: 'INVALID_SIGNATURES',
          message: 'Signatures must be a non-empty array'
        });
      }
      
      if (signatures.length > 50) {
        return res.status(400).json({
          error: 'Too many signatures',
          code: 'TOO_MANY_SIGNATURES',
          message: 'Maximum 50 signatures allowed per bulk operation'
        });
      }
      
      const transactionDAO = req.services.userRepository?.transactionDAO || 
                            req.services.clanRepository?.transactionDAO;
      
      const results = [];
      const errors = [];
      
      for (const signature of signatures) {
        try {
          let transaction = await transactionDAO.findBySignature(signature);
          
          if (!transaction) {
            errors.push({ signature, error: 'Transaction not found' });
            continue;
          }
          
          if (transaction.status === 'confirmed') {
            results.push({ signature, status: 'already_confirmed', transaction });
            continue;
          }
          
          transaction = await transactionDAO.update(transaction.id, {
            status: 'confirmed',
            confirmed_at: new Date(),
            metadata: {
              ...transaction.metadata,
              bulk_confirmed: true,
              bulk_confirmed_by: req.user.id,
              bulk_confirmed_at: new Date()
            }
          });
          
          results.push({ signature, status: 'confirmed', transaction });
          
        } catch (error) {
          errors.push({ signature, error: error.message });
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          results,
          errors,
          summary: {
            total: signatures.length,
            confirmed: results.filter(r => r.status === 'confirmed').length,
            alreadyConfirmed: results.filter(r => r.status === 'already_confirmed').length,
            failed: errors.length
          }
        },
        message: 'Bulk confirmation completed'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

export default router;