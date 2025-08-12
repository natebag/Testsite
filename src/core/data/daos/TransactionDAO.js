/**
 * Transaction Data Access Object (DAO) for MLG.clan Platform
 * 
 * Handles all database operations related to blockchain transactions,
 * MLG token operations, and transaction logging with comprehensive validation.
 * 
 * @author Claude Code - API Architect
 * @version 1.0.0
 * @created 2025-08-11
 */

import Joi from 'joi';
import { BaseDAO } from './BaseDAO.js';

const TRANSACTION_SCHEMAS = {
  create: Joi.object({
    user_id: Joi.string().uuid().required(),
    transaction_signature: Joi.string().min(86).max(88).required(),
    transaction_type: Joi.string().max(50).required(),
    amount: Joi.number().positive().optional(),
    token_mint: Joi.string().length(44).optional(),
    from_address: Joi.string().length(44).optional(),
    to_address: Joi.string().length(44).optional(),
    network: Joi.string().valid('mainnet', 'testnet', 'devnet').default('mainnet'),
    fee_lamports: Joi.number().integer().min(0).optional(),
    metadata: Joi.object().optional()
  })
};

export class TransactionDAO extends BaseDAO {
  constructor(options = {}) {
    super({
      tableName: 'blockchain_transactions',
      primaryKey: 'id',
      createSchema: TRANSACTION_SCHEMAS.create,
      cacheEnabled: true,
      cacheTTL: 600, // 10 minutes for transaction data
      cacheKeyPrefix: 'transaction',
      ...options
    });
  }

  async createTransaction(transactionData) {
    const startTime = Date.now();

    try {
      // Validate and create transaction
      const transaction = await this.create({
        ...transactionData,
        status: 'pending',
        metadata: transactionData.metadata ? JSON.stringify(transactionData.metadata) : '{}'
      });

      this.trackQueryPerformance(startTime, 'createTransaction');
      this.emitEvent('transaction_created', transaction);
      
      return transaction;

    } catch (error) {
      this.handleError('createTransaction', error, { transactionData });
      throw error;
    }
  }

  async updateTransactionStatus(transactionId, status, updateData = {}) {
    const startTime = Date.now();

    try {
      const validStatuses = ['pending', 'confirmed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid transaction status: ${status}`);
      }

      const updateFields = {
        status,
        ...updateData,
        updated_at: new Date()
      };

      if (status === 'confirmed' && updateData.block_height) {
        updateFields.confirmation_status = 'confirmed';
      }

      const result = await this.update(transactionId, updateFields);

      this.trackQueryPerformance(startTime, 'updateTransactionStatus');
      this.emitEvent('transaction_status_updated', { transaction: result, new_status: status });
      
      return result;

    } catch (error) {
      this.handleError('updateTransactionStatus', error, { transactionId, status, updateData });
      throw error;
    }
  }

  async findBySignature(signature, options = {}) {
    const startTime = Date.now();

    try {
      const query = `
        SELECT 
          bt.*,
          u.wallet_address,
          u.username
        FROM blockchain_transactions bt
        JOIN users u ON bt.user_id = u.id
        WHERE bt.transaction_signature = $1
      `;

      const result = await this.executeQuery(query, [signature]);
      
      this.trackQueryPerformance(startTime, 'findBySignature');
      return result.rows[0] || null;

    } catch (error) {
      this.handleError('findBySignature', error, { signature });
      throw error;
    }
  }

  async getUserTransactions(userId, options = {}) {
    const startTime = Date.now();
    const { 
      limit = 50, 
      offset = 0, 
      transactionType = null,
      status = null,
      dateFrom = null,
      dateTo = null
    } = options;

    try {
      let whereConditions = ['bt.user_id = $1'];
      const params = [userId];
      let paramIndex = 2;

      if (transactionType) {
        whereConditions.push(`bt.transaction_type = $${paramIndex}`);
        params.push(transactionType);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`bt.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (dateFrom) {
        whereConditions.push(`bt.created_at >= $${paramIndex}`);
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        whereConditions.push(`bt.created_at <= $${paramIndex}`);
        params.push(dateTo);
        paramIndex++;
      }

      const query = `
        SELECT 
          bt.*,
          CASE 
            WHEN bt.amount IS NOT NULL THEN bt.amount::text 
            ELSE '0' 
          END as amount_display
        FROM blockchain_transactions bt
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY bt.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const result = await this.executeQuery(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total FROM blockchain_transactions bt
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      this.trackQueryPerformance(startTime, 'getUserTransactions');

      return {
        transactions: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        }
      };

    } catch (error) {
      this.handleError('getUserTransactions', error, { userId, options });
      throw error;
    }
  }

  async getTransactionStats(userId, options = {}) {
    const startTime = Date.now();
    const { days = 30 } = options;

    try {
      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_transactions,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_transactions,
          COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed' AND transaction_type = 'vote_burn'), 0) as total_mlg_burned,
          COALESCE(SUM(fee_lamports) FILTER (WHERE status = 'confirmed'), 0) as total_fees_paid,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '${days} days') as recent_transactions,
          MAX(created_at) as last_transaction_date
        FROM blockchain_transactions
        WHERE user_id = $1
      `;

      const result = await this.executeQuery(query, [userId]);
      const stats = result.rows[0] || {};

      // Calculate success rate
      stats.success_rate = stats.total_transactions > 0 
        ? (stats.confirmed_transactions / stats.total_transactions) * 100 
        : 0;

      this.trackQueryPerformance(startTime, 'getTransactionStats');
      return stats;

    } catch (error) {
      this.handleError('getTransactionStats', error, { userId, options });
      throw error;
    }
  }

  async getPendingTransactions(options = {}) {
    const startTime = Date.now();
    const { olderThanMinutes = 5, limit = 100 } = options;

    try {
      const query = `
        SELECT 
          bt.*,
          u.wallet_address,
          EXTRACT(EPOCH FROM (NOW() - bt.created_at)) / 60 as minutes_pending
        FROM blockchain_transactions bt
        JOIN users u ON bt.user_id = u.id
        WHERE bt.status = 'pending'
          AND bt.created_at < NOW() - INTERVAL '${olderThanMinutes} minutes'
        ORDER BY bt.created_at ASC
        LIMIT $1
      `;

      const result = await this.executeQuery(query, [limit]);

      this.trackQueryPerformance(startTime, 'getPendingTransactions');
      return result.rows;

    } catch (error) {
      this.handleError('getPendingTransactions', error, options);
      throw error;
    }
  }
}

export default TransactionDAO;