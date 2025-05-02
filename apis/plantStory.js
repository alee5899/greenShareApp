import { axiosInstance } from "./axiosInstance";
import * as SecureStore from "expo-secure-store";

// 식물 커뮤니티 조회 API
export const getStories = async () => {
  const response = await axiosInstance.get("/plantStories");
  return response;
};

//앱에서 내 글만 조회하기
export const getMyPost = (userEmail) => {
  const response = axiosInstance.get(`/plantStories/user/${userEmail}`);
  return response;
};

//인기글 조회하기(좋아요 순)
export const getPopularPosts = () => {
  const response = axiosInstance.get("/plantStories/popular");
  return response;
};

//좋아요 기능
export const insertLike = async (boardNum) => {
  const response = await axiosInstance.post("/plantStories/like-insert", {
    boardNum,
  });
  return response;
};

// 좋아요 취소 기능
export const deleteLike = async (boardNum) => {
  const response = await axiosInstance.delete(
    `/plantStories/like-delete/${boardNum}`
  );
  return response.data;
};

// 댓글 등록 API
export const insertReply = async (replyData) => {
  const token = await SecureStore.getItemAsync("accessToken");

  const response = await axiosInstance.post(`/plantReplies`, replyData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

//댓글 삭제

export const deleteReply = (commentId) => {
  const response = axiosInstance.delete(`/plantReplies/${commentId}`);
  return response;
};

//댓글 수정

export const updateRelpy = (commentId) => {

}


// 게시글 당 댓글 조회
export const replyList = async (boardNum) => {
  const response = await axiosInstance.get(`/plantReplies/${boardNum}`);
  return response;
};

// 식물 커뮤니티 상세조회 API
export const getDetailStories = async (boardNum) => {
  const response = await axiosInstance.get(`/plantStories/${boardNum}`);
  return response;
};

// 식물 커뮤티니 삭제
export const deleteStories = async (boardNum) => {
  const response = await axiosInstance.delete(`/plantStories/${boardNum}`);
  return response.data;
};

// 식물 커뮤티니 수정
export const upDateStories = async (boardNum, updateData) => {
  const token = await SecureStore.getItemAsync("accessToken");

  const response = await axiosInstance.put(
    `/plantStories/${boardNum}`,
    updateData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
