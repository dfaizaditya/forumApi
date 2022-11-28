const pool = require('../../database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const AddedReplies = require('../../../Domains/replies/entities/AddedReplies');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const CommentTableTestHelper = require('../../../../tests/CommentsTableTestHelper');

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReplies function', () => {
    it('should add replies to comment and return add replies correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await UsersTableTestHelper.addUser({
        id: 'user-12345',
        username: 'dicodingUser',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({
        threadId: 'thread-123',
        owner: 'fakeUsername',
      });

      const addReplies = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        content: 'this is replies of comment',
        owner: 'dicodingUser',
      };
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      await replyRepositoryPostgres.addReplies(addReplies);

      // Assert
      const reply = await CommentTableTestHelper.findReplyByid(
        'reply-123',
      );
      expect(reply).toHaveLength(1);
    });

    it('should return added replies correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await UsersTableTestHelper.addUser({
        id: 'user-12345',
        username: 'dicodingUser',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({
        threadId: 'thread-123',
        owner: 'fakeUsername',
      });

      const addReplies = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        content: 'this is replies of comment',
        owner: 'dicodingUser',
      };
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedReplies = await replyRepositoryPostgres.addReplies(addReplies);

      // Assert
      expect(addedReplies).toStrictEqual(
        new AddedReplies({
          id: 'reply-123',
          content: addReplies.content,
          owner: addReplies.owner,
        }),
      );
    });
  });

  describe('deleteReplies function', () => {
    it('should update is_delete comment', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await UsersTableTestHelper.addUser({
        id: 'user-12345',
        username: 'dicodingUser',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({ owner: 'dicodingUser' });
      await CommentTableTestHelper.addReply({ owner: 'dicodingUser' });

      const data = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        replyId: 'reply-123',
        owner: 'dicodingUser',
      };
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(data),
      ).resolves.not.toThrowError(AuthorizationError);
      await replyRepositoryPostgres.deleteReplies(data.replyId);

      const checkReply = await CommentTableTestHelper.findReplyByid(
        data.replyId,
      );
      expect(checkReply[0].is_delete).toEqual(true);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw NotFoundError when replies not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({ owner: 'fakeUsername' });
      const data = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        replyId: 'reply-123',
        owner: 'fakeUsername',
      };

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);

      // Action & Assert
      await expect(
        replyRepositoryPostgres.verifyReplyOwner(data),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when deleting reply that were not belong to the owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await UsersTableTestHelper.addUser({
        id: 'user-12345',
        username: 'dicodingUser',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({ owner: 'fakeUsername' });
      await CommentTableTestHelper.addReply({ owner: 'fakeUsername' });

      const data = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        replyId: 'reply-123',
        owner: 'dicodingUser',
      };

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner(data))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when deleting reply that were belong to the owners', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await UsersTableTestHelper.addUser({
        id: 'user-12345',
        username: 'dicodingUser',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({ owner: 'fakeUsername' });
      await CommentTableTestHelper.addReply({ owner: 'dicodingUser' });

      const data = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        replyId: 'reply-123',
        owner: 'dicodingUser',
      };

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner(data))
        .resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('getRepliesByCommentId function', () => {
    it('should return property correcly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({ owner: 'fakeUsername' });
      await CommentTableTestHelper.addReply({ owner: 'fakeUsername', createdAt: new Date('2022-10-22T05:33:05.445Z') });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool);

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId(
        'thread-123',
      );

      // Assert
      expect(replies[0]).toHaveProperty('id', 'reply-123');
      expect(replies[0]).toHaveProperty('owner', 'fakeUsername');
      expect(replies[0]).toHaveProperty('comment', 'this is reply');
      expect(replies[0]).toHaveProperty('created_at', new Date('2022-10-22T05:33:05.445Z'));
      expect(replies[0]).toHaveProperty('is_delete', false);
      expect(replies[0]).toHaveProperty('comment_id', 'comment-123');
    });
  });
});
