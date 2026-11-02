"use client";

import { useEffect } from "react";
import { notifyCartChanged } from "@spindlecommerce/storefront-next/client";

/** Lets the header's cart badge re-read the cookies checkout cleared. */
export function CartCleared() {
  useEffect(() => {
    notifyCartChanged();
  }, []);
  return null;
}
