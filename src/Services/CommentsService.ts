import RestfulService from './RestfulService';

const restApiEndPoint = process.env.REACT_APP_REST_END_POINT;
const getAllCommentsUnderACompany = async (companyId: string, params: object = {}) => RestfulService.get(`/comment/company/${companyId}`, params);
const getAllCommentsForAnItem = async (itemId: string, params: object = {}) => RestfulService.get(`/comment/item/normal/message/${itemId}`, params);
const deleteComment = async (commentId: string, itemId: string) => RestfulService.delete(`/comment/${commentId}?item_url=${restApiEndPoint}/item/redirect?itemId=${itemId}`);
const createComment = async (comments: string, itemId: string, replyId: string) => RestfulService.post(`/comment/item/${itemId}`, {
  comments,
  is_private: false,
  item_url: `${restApiEndPoint}/item/redirect?itemId=${itemId}`,
  reply_to_comment_id: replyId,
});

const CommentsService = {
  getAllCommentsUnderACompany,
  getAllCommentsForAnItem,
  deleteComment,
  createComment,
};

export default CommentsService;
