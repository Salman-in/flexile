"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useCurrentUser, useUserStore } from "@/global";
import { request } from "@/utils/request";
import { internal_current_user_data_path } from "@/utils/routes";

export const useSwitchCompany = () => {
  const user = useCurrentUser();
  const queryClient = useQueryClient();

  const switchCompany = useCallback(
    async (companyId: string) => {
      useUserStore.setState((state) => ({ ...state, pending: true }));
      try {
        const response = await request({
          method: "GET",
          url: `${internal_current_user_data_path()}?company_id=${companyId}`,
          accept: "json",
        });
        const userData = await response.json();
        useUserStore.getState().login(userData);
        await queryClient.resetQueries({ queryKey: ["currentUser", user.email] });
      } finally {
        useUserStore.setState((state) => ({ ...state, pending: false }));
      }
    },
    [user.email, queryClient],
  );

  return { switchCompany };
};
