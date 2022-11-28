const pool = require('../../database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const CommentTableTestHelper = require('../../../../tests/CommentsTableTestHelper');

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should add comment to tread and return add comment correctly', async () => {
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
      const addComment = new AddComment({
        threadId: 'thread-123',
        content: 'this is comment from thread',
        owner: 'dicodingUser',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      await commentRepositoryPostgres.addComment(addComment);
      // Assert
      const comment = await CommentTableTestHelper.findCommentById(
        'comment-123',
      );
      expect(comment).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
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
      const addComment = new AddComment({
        threadId: 'thread-123',
        content: 'this is comment from thread',
        owner: 'dicodingUser',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(
        addComment,
      );
      // Assert
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: 'comment-123',
          content: 'this is comment from thread',
          owner: 'dicodingUser',
        }),
      );
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw NotfoundError when comment id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });

      const data = {
        threadId: 'thread-123',
        commentId: 'comment-xxxxx',
        owner: 'fakeUsername',
      };
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(data),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when the comment is not belong to the owner', async () => {
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

      const data = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        owner: 'fakeUsername',
      };
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(data),
      ).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when the comment belong to the owner', async () => {
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

      const data = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        owner: 'dicodingUser',
      };

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(data),
      ).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('deleteComment function', () => {
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

      const data = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        owner: 'dicodingUser',
      };
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(data),
      ).resolves.not.toThrowError(AuthorizationError);
      await commentRepositoryPostgres.deleteComment(data.commentId);

      const checkComment = await CommentTableTestHelper.findCommentById(
        data.commentId,
      );
      expect(checkComment[0].is_delete).toEqual(true);
    });
  });

  describe('isCommentExsist function', () => {
    it('should throw NotFoundError when comment id not found', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action & Assert
      await expect(
        commentRepositoryPostgres.isCommentExist('comment-xxxxxxx'),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when comment id is exist', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({
        threadId: 'thread-123',
        owner: 'fakeUsername',
      });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action & Assert
      await expect(
        commentRepositoryPostgres.isCommentExist('comment-123'),
      ).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('getCommentByThreadId function', () => {
    it('should return property correcly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'fakeUsername' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({ owner: 'fakeUsername', createdAt: new Date('2022-10-22T05:33:05.445Z') });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      // Action
      const commentDetails = await commentRepositoryPostgres.getCommentByThreadId('thread-123');

      // Assert
      expect(commentDetails[0]).toHaveProperty('id', 'comment-123');
      expect(commentDetails[0]).toHaveProperty('content', 'this is comment');
      expect(commentDetails[0]).toHaveProperty('username', 'fakeUsername');
      expect(commentDetails[0]).toHaveProperty('date', new Date('2022-10-22T05:33:05.445Z'));
    });

    it('should return is_deleted true if comments was deleted', async () => {
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
        id: 'comment-123',
        owner: 'fakeUsername',
      });
      await CommentTableTestHelper.addComment({
        id: 'comment-324',
        owner: 'fakeUsername',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      // Action
      await commentRepositoryPostgres.deleteComment('comment-324');
      const result = await commentRepositoryPostgres.getCommentByThreadId(
        'thread-123',
      );
      // Assert
      expect(result[0]).toHaveProperty('id', 'comment-123');
      expect(result[1]).toHaveProperty('id', 'comment-324');
      expect(result[0]).toHaveProperty('is_delete', false);
      expect(result[1]).toHaveProperty('is_delete', true);
      expect(result).toHaveLength(2);
    });
  });
});
