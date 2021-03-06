import Vue from "vue";
import Vuex from "vuex";
import Axios from "axios";
import router from "../router/index";
import { SocketStore } from "./SocketStore";

Vue.use(Vuex);

//Allows axios to work locally or live
export const base = window.location.host.includes("localhost")
  ? "//localhost:3000/"
  : "/";

let api = Axios.create({
    baseURL: base + "api/",
    timeout: 10000,
    withCredentials: true,
});

export default new Vuex.Store({
  state: {
    user: {},
    post: {},
    activePost: { support: [], disregard: [] },
    posts: [],
    comments: [],
    choice: {},
    loadingPosts: false,
    lastLoaded: false,
    timestamp: "",
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setPost(state, post) {
      state.post = post;
    },
    setPosts(state, posts) {
      state.posts.push(...posts);
    },
    setActivePost(state, post = { support: [], disregard: [] }) {
      state.activePost = post;
    },
    setComments(state, comments) {
      state.comments = comments;
    },
    setLoadingPosts(state, bool) {
      state.loadingPosts = bool;
    },
    setLastLoaded(state, bool) {
      state.lastLoaded = bool;
    },
    setRemovePost(state, postId){
      let res = state.posts.find(x => x.id == postId)
      state.posts.splice(res, 1)
    },
    setTimestamp(state, timestamp){
      state.timestamp = timestamp
    }
  },
  actions: {
    //#region -- AUTH STUFF --
    setBearer({ dispatch }, bearer) {
      api.defaults.headers.authorization = bearer;
      dispatch("initializeSocket", bearer);
    },
    resetBearer() {
      api.defaults.headers.authorization = "";
    },
    async getProfile({ commit }) {
      try {
        let res = await api.get("profile");
        commit("setUser", res.data);
      } catch (err) {
        console.error(err);
      }
    },

    async addUserInput({ commit, dispatch }, postData) {
      try {
        let res = await api.put("posts/" + postData.id + "/vote", postData);
      } catch (err) {
        console.error(err);
      }
    },
    //#endregion

    //#region -- POSTS --

    async getPosts({ commit, dispatch }, postsLength) {
      return new Promise(async (resolve, reject) => {
        try {
          let res = await api.get("posts?skip=" + postsLength);
          console.log("from get posts in store", res);
          commit("setPosts", res.data);
          resolve();
          //NOTE change this if .limit is changed in PostsService
          if (res.data.length == 0) {
            commit("setLastLoaded", true);
          }
        } catch (error) {
          console.error(error, "failed to get posts from get posts in store");
          reject(error);
        }
        finally {
          commit("setLoadingPosts", false);
        }
      });
    },

    async getPost({ commit, dispatch }, postId) {
      try {
        let res = await api.get(`posts/${postId}`);
        if (res.data.id) {
          commit("setActivePost", res.data);
        }

        if (
          res.data.support &&
          // @ts-ignore
          res.data.support.find((i) => i == this.$app.$auth.user.email)
        ) {
          dispatch("JoinRoom", res.data.id + ":support");
        } else {
          dispatch("JoinRoom", res.data.id + ":disregard");
        }
      } catch (error) {
        console.error(error);
      }
    },

    async addPost({ commit, dispatch }, postData) {
      try {
        let res = await api.post("posts", postData);
        console.log("addPost from store", postData);
        window.location.reload()
        // NOTE do we want this to push us to the post details page
        // dispatch("getPosts");
      } catch (error) {
        console.error(error, "addPost in store failing");
      }
    },
    async deletePost({ commit, dispatch }, postId) {
      try {
        dispatch("removeFromArray", postId);
        await api.delete("posts/" + postId);
        let posts = [];
        commit("setPosts", posts);
        router.push({ name: "home", params: {} });
      } catch (error) {
        console.error("deletePost failed: ", error);
      }
    },
    removeFromArray({ commit }, postId) {
      commit('setRemovePost', postId)
    },
    //#endregion

    //#region -- COMMENTS  --
    async getComments({ commit }, postId) {
      try {
        let res = await api.get("posts/" + postId + "/comments");
        commit("setComments", res.data);
      } catch (error) {
        console.error("getComments failing", error);
      }
    },
    async addComment({ dispatch }, comment) {
      try {
        let res = await api.post("comments/", comment);
        console.log("addComment: ", res.data);
        // dispatch("getComments", comment.postId);
      } catch (error) {
        console.error("addComment failing: ", error);
      }
    },
    async deleteComment({ dispatch }, comment) {
      try {
        await api.delete("comments/" + comment.id);
        dispatch("getComments", comment.postId);
      } catch (error) {
        console.error("deleteComment failed: ", error);
      }
    },
    //#endregion

    //#region -- WHATEVS 4 NOW--
    //#endregion
  },
  modules: {
    SocketStore,
  },
});
