import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function IndexScreen(): React.ReactElement {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return <Redirect href={isAuthenticated ? "/browse-tasks" : "/sign-in"} />;
}
