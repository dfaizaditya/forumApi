// istanbul ignore file

const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentTableTestHelper = {
  async addComment({
    id = 'comment-123',
    threadId = 'thread-123',
    owner = 'user-123',
    comment = 'this is comment',
    createdAt = new Date().toISOString(),
  }) {
    const query = {
      text: 'INSERT INTO comments VALUES ($1, $2, $3, $4, $5)',
      values: [id, threadId, owner, comment, createdAt],
    };
    await pool.query(query);
  },

  async findCommentById(commentId) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [commentId],
    };
    const result = await pool.query(query);
    return result.rows;
  },

  async addReply({
    id = 'reply-123',
    threadId = 'thread-123',
    commentId = 'comment-123',
    owner = 'user-123',
    reply = 'this is reply',
    createdAt = new Date().toISOString(),
  }) {
    const query = {
      text: 'INSERT INTO replies VALUES ($1, $2, $3, $4, $5, $6)',
      values: [id, threadId, commentId, owner, reply, createdAt],
    };
    await pool.query(query);
  },

  async findReplyByid(replyId) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [replyId],
    };
    const result = await pool.query(query);
    return result.rows;
  },

  async deleteComment(commentId) {
    const query = {
      text: 'UPDATE comments SET is_delete = true WHERE id = $1',
      values: [commentId],
    };
    await pool.query(query);
  },

  async deleteReply(replyId) {
    const query = {
      text: 'UPDATE replies SET is_delete = true WHERE id = $1',
      values: [replyId],
    };
    await pool.query(query);
  },

  async findLikedComment(username, commentId) {
    const query = {
      text: 'SELECT comment_id, owner FROM likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, username],
    };
    const result = await pool.query(query);
    return result.rows;
  },

  async addLike({
    id = 'like-123',
    owner = 'user-123',
    commentId = 'comment-123',
  }) {
    const query = {
      text: 'INSERT INTO likes VALUES ($1, $2, $3)',
      values: [id, commentId, owner],
    };
    await pool.query(query);
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments where 1=1');
    await pool.query('DELETE FROM replies WHERE 1=1');
    await pool.query('DELETE FROM likes  WHERE 1=1');
  },
};

module.exports = CommentTableTestHelper;
