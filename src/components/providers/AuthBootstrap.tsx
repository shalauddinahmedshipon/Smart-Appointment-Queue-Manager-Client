"use client";

import { useEffect, useState } from "react";
import { useGetMeQuery } from "@/store/api/auth.api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials, logout } from "@/store/slices/auth.slice";

export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const [checking, setChecking] = useState(true);

  const { data, error, isLoading } = useGetMeQuery(undefined, {
    skip: !accessToken, // 🔥 VERY IMPORTANT
  });

  useEffect(() => {
    if (!accessToken) {
      setChecking(false);
      return;
    }

    if (data) {
      dispatch(setCredentials({ user: data, accessToken }));
    }

    if (error) {
      dispatch(logout());
    }

    setChecking(false);
  }, [data, error, accessToken, dispatch]);

  if (checking || isLoading) return null;

  return null;
}
