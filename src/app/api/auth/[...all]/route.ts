import { auth } from "@/server/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { ensureDbInitialized } from "@/lib/db";
import { NextRequest } from "next/server";

const { POST: authPost, GET: authGet } = toNextJsHandler(auth);

export async function POST(request: NextRequest) {
  await ensureDbInitialized();
  return authPost(request);
}

export async function GET(request: NextRequest) {
  await ensureDbInitialized();
  return authGet(request);
}
