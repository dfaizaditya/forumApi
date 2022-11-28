const AddedReplies = require('../../Domains/replies/entities/AddedReplies');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class RepliesRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReplies(payload) {
    const id = `reply-${this._idGenerator()}`;
    const {
      threadId, commentId, content, owner,
    } = payload;

    const query = {
      text: 'INSERT INTO replies VALUES ($1, $2, $3, $4, $5) RETURNING id, comment, owner',
      values: [id, threadId, commentId, owner, content],
    };

    const result = await this._pool.query(query);

    return new AddedReplies({
      id: result.rows[0].id,
      content: result.rows[0].comment,
      owner: result.rows[0].owner,
    });
  }

  async deleteReplies(replyId) {
    const query = {
      text: 'UPDATE replies SET is_delete = true WHERE id = $1',
      values: [replyId],
    };

    await this._pool.query(query);
  }

  async verifyReplyOwner(payload) {
    const { replyId, owner } = payload;

    const query = {
      text: 'SELECT owner FROM replies WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('reply tidak ditemukan');
    }

    const { owner: replyOwner } = result.rows[0];

    if (owner !== replyOwner) {
      throw new AuthorizationError('anda tidak dapat menghapus resoucre ini');
    }
  }

  async getRepliesByThreadId(threadId) {
    const query = {
      text: `SELECT id, owner, comment, created_at, is_delete, comment_id
      FROM replies WHERE thread_id = $1 ORDER BY created_at`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

module.exports = RepliesRepositoryPostgres;
