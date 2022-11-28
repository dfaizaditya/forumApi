const AddComent = require('../AddComment');

describe('AddComment entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      threadId: 1234,
      content: 'test comment content',
    };

    // Action and Assert
    expect(() => new AddComent(payload)).toThrowError(
      'ADD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY',
    );
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 123,
      threadId: '123',
      owner: {},
    };

    // Action and Assert
    expect(() => new AddComent(payload)).toThrowError(
      'ADD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });

  it('should create AddComment entities correctly', () => {
    // Arrange
    const payload = {
      content: 'test comment content',
      threadId: 'thread-123',
      owner: 'user-123',
    };
    // Action
    const addComment = new AddComent(payload);
    // Assert
    expect(addComment).toBeInstanceOf(AddComent);
    expect(addComment.content).toEqual(payload.content);
    expect(addComment.threadId).toEqual(payload.threadId);
    expect(addComment.owner).toEqual(payload.owner);
  });
});
