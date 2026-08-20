import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GetCurrentUser } from "@/actions/user";

export async function GET() {
  const userRes = await GetCurrentUser();
  const cookieStore = await cookies();
  const merchantId = cookieStore.get("wallet-id")?.value || "";

  if (userRes.success && userRes.data) {
    return NextResponse.json({
      ...userRes.data,
      merchantId,
    });
  }

  const email = cookieStore.get("user-email")?.value || "";
  const username =
    cookieStore.get("username")?.value || email.split("@")[0] || "User";

  return NextResponse.json({
    email,
    username,
    merchantId,
  });
}
