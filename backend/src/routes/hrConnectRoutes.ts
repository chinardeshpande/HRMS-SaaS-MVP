import { Router } from 'express';
import * as hrConnectController from '../controllers/hrConnectController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Post routes
router.get('/posts', hrConnectController.getAllPosts);
router.get('/posts/:postId', hrConnectController.getPostById);
router.post('/posts', hrConnectController.createPost);
router.put('/posts/:postId', hrConnectController.updatePost);
router.delete('/posts/:postId', hrConnectController.deletePost);

// Reaction routes
router.post('/posts/:postId/reactions', hrConnectController.addReaction);
router.delete('/posts/:postId/reactions', hrConnectController.removeReaction);

// Comment routes
router.get('/posts/:postId/comments', hrConnectController.getComments);
router.post('/posts/:postId/comments', hrConnectController.addComment);
router.delete('/comments/:commentId', hrConnectController.deleteComment);

// Group routes
router.get('/groups', hrConnectController.getGroups);
router.post('/groups', hrConnectController.createGroup);
router.put('/groups/:groupId', hrConnectController.updateGroup);
router.delete('/groups/:groupId', hrConnectController.deleteGroup);

export default router;
