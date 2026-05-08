// src/api/api_right_sidebar.ts

import api from "@/lib/axios";

export const getFriends = async () => {
    const response = await api.get("/api/v1/friend/list");
    return response.data?.data || [];
};

export const getUserGroups = async () => {
    const response = await api.get("/api/v1/user/groups");
    return response.data?.data || [];
};

export const getRightSidebarData = async () => {
    const [friends, groups] = await Promise.all([
        getFriends(),
        getUserGroups(),
    ]);

    return {
        friends,
        groups
    };
};