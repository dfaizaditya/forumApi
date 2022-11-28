const pool = require('../../database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('/threads/{threadId}/comments/{commentId}/likes', () => {
  let accessToken;
  const threadId = 'thread-123';
  const commentId = 'comment-123';

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    const server = await createServer(container);

    await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        username: 'dicodingUser',
        password: 'secret',
        fullname: 'Dicoding User',
      },
    });

    const requestAuth = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: 'dicodingUser',
        password: 'secret',
      },
    });
    const authResponse = JSON.parse(requestAuth.payload);

    accessToken = authResponse.data.accessToken;

    await ThreadsTableTestHelper.addThread({ owner: 'dicodingUser' });
    await CommentsTableTestHelper.addComment({ owner: 'dicodingUser' });
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 and persisted add like', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should response 200 and persisted remove like', async () => {
      // Arrange
      const server = await createServer(container);

      await CommentsTableTestHelper.addLike({ owner: 'dicodingUser' });

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });
});
