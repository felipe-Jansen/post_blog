const { validationResult } = require('express-validator/check');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItens;
  Post.find().countDocuments()
      .then(count => {
        totalItens = count;
        return Post.find()
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
      }).then(posts => {
      res.status(200).json({ message: 'Fetched posts successfully.', posts: posts, totalItens: totalItens });
      }).catch(err => {
          if (!err.statusCode) {
              err.statusCode = 500;
          }
          next(err);
      });
};
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = null;
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });
  post.save()
    .then(result => {
        return User.findById(req.userId);
    }).then(user => {
      creator = user;
      user.posts.push(post);
      return user.save();
    }).then(result => {
      res.status(201).json({
          message: 'Post created successfully!',
          post: post,
          creator: {_id: creator._id, name: creator.name }
      });
    }).catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Post fetched.', post: post });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 442;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  Post.findById(postId)
      .then(post => {
        if (!post) {
          const error = new Error('Could not find post.');
          error.statusCode = 404;
          throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not Authorized!');
            error.statusCode = 403;
            throw error;
        }
        post.title = title;
        post.imageUrl = null;
        post.content = content;
        return post.save();
      }).then(result => {
        res.status(200).json({message: 'Post Updated!', post: result})
      }).catch(err => {
        if (!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
      });
};
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
      .then(post => {
        if (!post) {
          const error = new Error('Could not find post');
          error.statusCode = 404;
          throw error;
        }
        if (post.creator.toString() !== req.userId) {
          const error = new Error('Not Authorized!');
          error.statusCode = 403;
          throw error;
        }
        // Check logged user
        return Post.findByIdAndRemove(postId);
      }).then(result => {
        console.log(result);
        return User.findById(req.userId);
      }).then(user => {
        user.posts.pull(postId);
        return user.save();
      }).then(result => {
        res.status(200).json({message: 'Deleted Post'})
      }).catch(err => {
        if (!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
      });
  };
