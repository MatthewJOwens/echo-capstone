import express from "express";
import BaseController from "../utils/BaseController";
import auth0provider from "@bcwdev/auth0provider";
import { postsService } from "../services/PostsService";
import { commentsService } from '../services/CommentsService'
import CheckEmail from "../utils/checkEmail";

export class PostsController extends BaseController {
  constructor() {
    super("api/posts");
    this.router
      .get("", this.getAll)
      .use(auth0provider.getAuthorizedUserInfo)
      .get('/:id/comments', this.getCommentsByPostId)
      .get("/:id", this.getById)
      .put("/:id", this.edit)
      .put("/:id/vote", this.vote)
      .use(CheckEmail)
      .post("", this.create)
      .delete("/:id", this.delete)

  }

  async getAll(req, res, next) {
    try {
      let data = await postsService.getAll(req.query.skip);
      return res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async getCommentsByPostId(req, res, next) {
    try {
      let data = await commentsService.getCommentsByPostId(req.params.id)
      return res.send(data)
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      let data = await postsService.getById(req.params.id);
      return res.send(data);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      req.body.creatorEmail = req.userInfo.email;
      let data = await postsService.create(req.body);
      return res.status(201).send(data);
    } catch (error) {
      next(error);
    }
  }

  async edit(req, res, next) {
    try {
      let data = await postsService.edit(
        req.params.id,
        req.body
      );
      return res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async vote(req, res, next) {
    try {
      let data = await postsService.vote(
        req.params.id,
        req.body.choice ? "support" : "disregard",
        req.userInfo.email
      );
      return res.send(data);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await postsService.delete(req.params.id);
      return res.status(204).send("Successfully deleted");
    } catch (error) {
      next(error);
    }
  }

}