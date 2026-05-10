"use client";

import { useState, useEffect } from "react";

type City = { id: string; nom: string; code: string };

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => setCities(data))
      .catch(() => {});
  }, []);

  return cities;
}
