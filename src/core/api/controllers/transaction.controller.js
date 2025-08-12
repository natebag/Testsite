/**
 * Transaction Controller for MLG.clan API
 * 
 * Handles blockchain transaction tracking, confirmation, and
 * transaction-related operations using the TransactionDAO.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import { asyncHandler } from '../middleware/error.middleware.js';
import { APIErrors } from '../middleware/error.middleware.js';

/**
 * Transaction Controller Class
 */
export class TransactionController {
  /**
   * Get user transactions
   * GET /api/transactions
   */
  static getUserTransactions = asyncHandler(async (req, res) => {
    const { 
      transactionType, 
      status, 
      walletAddress,
      page = 1, 
      limit = 20,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;
    
    // If walletAddress is provided and different from user's wallet, check admin permissions
    const targetWallet = walletAddress || req.user.walletAddress;
    if (walletAddress && walletAddress !== req.user.walletAddress && !req.user.roles?.includes('admin')) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.user.roles || []);
    }
    
    const transactionDAO = req.services.userRepository?.transactionDAO || 
                          req.services.clanRepository?.transactionDAO;
    
    if (!transactionDAO) {
      throw APIErrors.INTERNAL_ERROR('Transaction service unavailable');
    }
    
    try {
      const searchParams = {
        walletAddress: targetWallet,
        transactionType,
        status,
        dateRange: startDate ? {
          start: new Date(startDate),
          end: endDate ? new Date(endDate) : undefined
        } : undefined,
        amountRange: minAmount ? {
          min: parseFloat(minAmount),
          max: maxAmount ? parseFloat(maxAmount) : undefined
        } : undefined
      };
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: [[sortBy, sortOrder]]
      };
      
      const transactions = await transactionDAO.findMany({
        conditions: searchParams,
        ...options
      });
      
      res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: transactions.length,
            hasMore: transactions.length === parseInt(limit)
          }
        },
        message: 'Transactions retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get transaction by signature
   * GET /api/transactions/:signature
   */
  static getTransactionBySignature = asyncHandler(async (req, res) => {
    const { signature } = req.params;
    
    const transactionDAO = req.services.userRepository?.transactionDAO || 
                          req.services.clanRepository?.transactionDAO;
    
    if (!transactionDAO) {
      throw APIErrors.INTERNAL_ERROR('Transaction service unavailable');
    }
    
    try {
      const transaction = await transactionDAO.findBySignature(signature);
      
      if (!transaction) {
        throw APIErrors.RESOURCE_NOT_FOUND('Transaction', signature);
      }
      
      // Check if user can view this transaction
      const canView = transaction.wallet_address === req.user.walletAddress ||
                     transaction.user_id === req.user.id ||
                     req.user.roles?.includes('admin');
      
      if (!canView) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['owner', 'admin'], ['user']);
      }
      
      res.status(200).json({
        success: true,
        data: {
          transaction
        },
        message: 'Transaction retrieved successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Transaction', signature);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get transaction statistics
   * GET /api/transactions/stats
   */
  static getTransactionStats = asyncHandler(async (req, res) => {
    const { period = '30d', walletAddress, transactionType } = req.query;
    
    // Check permissions for specific wallet
    const targetWallet = walletAddress || req.user.walletAddress;
    if (walletAddress && walletAddress !== req.user.walletAddress && !req.user.roles?.includes('admin')) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.user.roles || []);
    }
    
    const transactionDAO = req.services.userRepository?.transactionDAO || 
                          req.services.clanRepository?.transactionDAO;
    
    if (!transactionDAO) {
      throw APIErrors.INTERNAL_ERROR('Transaction service unavailable');
    }
    
    try {
      const stats = await transactionDAO.getTransactionStats(targetWallet, {
        period,
        transactionType
      });
      
      res.status(200).json({
        success: true,
        data: {
          stats
        },
        message: 'Transaction statistics retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Confirm blockchain transaction
   * POST /api/transactions/confirm
   */
  static confirmTransaction = asyncHandler(async (req, res) => {
    const { signature, transactionType, amount, metadata } = req.body;
    
    const transactionDAO = req.services.userRepository?.transactionDAO || 
                          req.services.clanRepository?.transactionDAO;
    
    if (!transactionDAO) {
      throw APIErrors.INTERNAL_ERROR('Transaction service unavailable');
    }
    
    try {
      // First, check if transaction already exists
      let transaction = await transactionDAO.findBySignature(signature);
      
      if (transaction) {
        // Update existing transaction
        transaction = await transactionDAO.update(transaction.id, {
          status: 'confirmed',
          confirmed_at: new Date(),
          metadata: { ...transaction.metadata, ...metadata }
        });
      } else {
        // Create new transaction record
        transaction = await transactionDAO.create({
          signature,
          transaction_type: transactionType,
          amount: amount || 0,
          wallet_address: req.user.walletAddress,
          user_id: req.user.id,
          status: 'confirmed',
          confirmed_at: new Date(),
          metadata: metadata || {}
        });
      }
      
      // Emit transaction confirmation event
      if (req.io) {
        req.io.to(`user:${req.user.id}`).emit('transaction_confirmed', {
          transaction: {
            id: transaction.id,
            signature: transaction.signature,
            type: transaction.transaction_type,
            amount: transaction.amount,
            status: transaction.status
          }
        });
        
        // If it's a clan-related transaction, notify clan members
        if (transaction.clan_id) {
          req.io.to(`clan:${transaction.clan_id}`).emit('clan_transaction_confirmed', {
            transaction,
            user: {
              id: req.user.id,
              username: req.user.username || 'Anonymous'
            }
          });
        }
      }
      
      // Process transaction based on type
      await this.processTransactionByType(transaction, req);
      
      res.status(200).json({
        success: true,
        data: {
          transaction
        },
        message: 'Transaction confirmed successfully'
      });
      
    } catch (error) {
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        throw APIErrors.VALIDATION_FAILED([{
          field: 'signature',
          message: 'Invalid transaction signature or data',
          value: signature
        }]);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Process transaction based on type
   */
  static async processTransactionByType(transaction, req) {
    try {
      switch (transaction.transaction_type) {
        case 'vote_purchase':
          // Update user vote balance
          if (req.services.votingRepository) {
            await req.services.votingRepository.processVotePurchaseTransaction(
              transaction.user_id,
              transaction.amount,
              transaction.id
            );
          }
          break;
          
        case 'stake':
          // Process clan staking
          if (req.services.clanRepository && transaction.clan_id) {
            await req.services.clanRepository.processStakeTransaction(
              transaction.clan_id,
              transaction.user_id,
              transaction.amount,
              transaction.id
            );
          }
          break;
          
        case 'unstake':
          // Process unstaking
          if (req.services.clanRepository && transaction.clan_id) {
            await req.services.clanRepository.processUnstakeTransaction(
              transaction.clan_id,
              transaction.user_id,
              transaction.amount,
              transaction.id
            );
          }
          break;
          
        case 'reward_claim':
          // Process reward claim
          if (req.services.userRepository) {
            await req.services.userRepository.processRewardClaim(
              transaction.user_id,
              transaction.amount,
              transaction.id
            );
          }
          break;
          
        case 'transfer':
          // Process token transfer
          // This might not require additional processing
          break;
          
        default:
          console.warn(`Unknown transaction type: ${transaction.transaction_type}`);
      }
    } catch (error) {
      console.error(`Failed to process transaction ${transaction.id}:`, error);
      // Update transaction status to indicate processing error
      const transactionDAO = req.services.userRepository?.transactionDAO || 
                            req.services.clanRepository?.transactionDAO;
      if (transactionDAO) {
        await transactionDAO.update(transaction.id, {
          status: 'processing_failed',
          metadata: {
            ...transaction.metadata,
            processing_error: error.message,
            processing_failed_at: new Date()
          }
        });
      }
    }
  }
  
  /**
   * Get pending transactions for user
   * GET /api/transactions/pending
   */
  static getPendingTransactions = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const transactionDAO = req.services.userRepository?.transactionDAO || 
                          req.services.clanRepository?.transactionDAO;
    
    if (!transactionDAO) {
      throw APIErrors.INTERNAL_ERROR('Transaction service unavailable');
    }
    
    try {
      const pendingTransactions = await transactionDAO.findMany({
        conditions: {
          user_id: req.user.id,
          status: 'pending'
        },
        limit: parseInt(limit),
        orderBy: [['created_at', 'desc']]
      });
      
      res.status(200).json({
        success: true,
        data: {
          transactions: pendingTransactions
        },
        message: 'Pending transactions retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Cancel pending transaction
   * POST /api/transactions/:id/cancel
   */
  static cancelTransaction = asyncHandler(async (req, res) => {
    const { id: transactionId } = req.params;
    const { reason } = req.body;
    
    const transactionDAO = req.services.userRepository?.transactionDAO || 
                          req.services.clanRepository?.transactionDAO;
    
    if (!transactionDAO) {
      throw APIErrors.INTERNAL_ERROR('Transaction service unavailable');
    }
    
    try {
      const transaction = await transactionDAO.findById(transactionId);
      
      if (!transaction) {
        throw APIErrors.RESOURCE_NOT_FOUND('Transaction', transactionId);
      }
      
      // Check if user owns this transaction or is admin
      if (transaction.user_id !== req.user.id && !req.user.roles?.includes('admin')) {
        throw APIErrors.INSUFFICIENT_PERMISSIONS(['owner', 'admin'], ['user']);
      }
      
      // Check if transaction can be cancelled
      if (transaction.status !== 'pending') {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Transaction status', 'Only pending transactions can be cancelled');
      }
      
      const cancelledTransaction = await transactionDAO.update(transactionId, {
        status: 'cancelled',
        cancelled_at: new Date(),
        metadata: {
          ...transaction.metadata,
          cancellation_reason: reason,
          cancelled_by: req.user.id
        }
      });
      
      // Emit cancellation event
      if (req.io) {
        req.io.to(`user:${req.user.id}`).emit('transaction_cancelled', {
          transactionId,
          reason
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          transaction: cancelledTransaction
        },
        message: 'Transaction cancelled successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Transaction', transactionId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Get global transaction statistics (admin only)
   * GET /api/transactions/global-stats
   */
  static getGlobalTransactionStats = asyncHandler(async (req, res) => {
    if (!req.user.roles?.includes('admin')) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.user.roles || []);
    }
    
    const { period = '30d' } = req.query;
    
    const transactionDAO = req.services.userRepository?.transactionDAO || 
                          req.services.clanRepository?.transactionDAO;
    
    if (!transactionDAO) {
      throw APIErrors.INTERNAL_ERROR('Transaction service unavailable');
    }
    
    try {
      const globalStats = await transactionDAO.getGlobalStats(period);
      
      res.status(200).json({
        success: true,
        data: {
          stats: globalStats
        },
        message: 'Global transaction statistics retrieved successfully'
      });
      
    } catch (error) {
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
  
  /**
   * Retry failed transaction processing
   * POST /api/transactions/:id/retry
   */
  static retryTransaction = asyncHandler(async (req, res) => {
    const { id: transactionId } = req.params;
    
    // Only admins can retry failed transactions
    if (!req.user.roles?.includes('admin')) {
      throw APIErrors.INSUFFICIENT_PERMISSIONS(['admin'], req.user.roles || []);
    }
    
    const transactionDAO = req.services.userRepository?.transactionDAO || 
                          req.services.clanRepository?.transactionDAO;
    
    if (!transactionDAO) {
      throw APIErrors.INTERNAL_ERROR('Transaction service unavailable');
    }
    
    try {
      const transaction = await transactionDAO.findById(transactionId);
      
      if (!transaction) {
        throw APIErrors.RESOURCE_NOT_FOUND('Transaction', transactionId);
      }
      
      if (transaction.status !== 'processing_failed') {
        throw APIErrors.BUSINESS_RULE_VIOLATION('Transaction status', 'Only failed transactions can be retried');
      }
      
      // Reset transaction status and retry processing
      const updatedTransaction = await transactionDAO.update(transactionId, {
        status: 'confirmed',
        metadata: {
          ...transaction.metadata,
          retry_attempted_at: new Date(),
          retry_attempted_by: req.user.id
        }
      });
      
      // Retry processing
      await this.processTransactionByType(updatedTransaction, req);
      
      res.status(200).json({
        success: true,
        data: {
          transaction: updatedTransaction
        },
        message: 'Transaction processing retried successfully'
      });
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw APIErrors.RESOURCE_NOT_FOUND('Transaction', transactionId);
      }
      
      throw APIErrors.INTERNAL_ERROR(error.message);
    }
  });
}

export default TransactionController;