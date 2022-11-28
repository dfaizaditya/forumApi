const ThreadDetails = require('../../Domains/threads/entities/ThreadDetails');
const CommentDetails = require('../../Domains/comments/entities/CommentDetails');
const RepliesDetails = require('../../Domains/replies/entities/RepliesDetails');

class GetThreadDetailsUseCase {
  constructor({
    threadRepository,
    commentRepository,
    repliesRepository,
    likeRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._repliesRepository = repliesRepository;
    this._likeRepository = likeRepository;
  }

  async execute(threadId) {
    this._validatePayload(threadId);

    const dataThreads = await this._threadRepository.getThreadById(threadId);
    const dataComments = await this._commentRepository.getCommentByThreadId(
      threadId,
    );
    const dataReply = await this._repliesRepository.getRepliesByThreadId(
      threadId,
    );
    const dataLike = await this._likeRepository.getLikeCountByThreadId(
      threadId,
    );

    const commentMap = dataComments.map((data) => {
      const replies = dataReply
        .filter((reply) => reply.comment_id === data.id)
        .map(
          (reply) => new RepliesDetails({
            id: reply.id,
            username: reply.owner,
            date: reply.created_at,
            content: reply.comment,
            is_delete: reply.is_delete,
          }),
        );

      const like = dataLike.find((count) => count.comment_id === data.id);

      return new CommentDetails({
        ...data,
        likeCount: like !== undefined ? like.like_count : 0,
        replies,
      });
    });

    return new ThreadDetails({
      ...dataThreads,
      comments: commentMap,
    });
  }

  _validatePayload(threadId) {
    if (!threadId) {
      throw new Error('GET_THREAD_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof threadId !== 'string') {
      throw new Error(
        'GET_THREAD_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    }
  }
}

module.exports = GetThreadDetailsUseCase;
