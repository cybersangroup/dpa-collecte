import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const cities = await db.city.findMany({
    where: { actif: true },
    select: { id: true, nom: true, code: true },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(cities);
}
