import Logo from "@/components/Logo";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] px-4">
      <section className="w-full max-w-sm rounded-3xl border border-[#ebebeb] bg-white p-6 sm:p-8">
        <Logo width={80} height={32} />
        <p className="mb-8 mt-1 text-xs text-[#6a6c72]">Tenant Dashboard [for APIs]</p>
        <h1 className="mb-2 text-lg font-semibold text-[#0f172a]">Choose a new password</h1>
        <p className="mb-6 text-sm text-[#64748b]">
          Use between 8 and 128 characters for your new password.
        </p>
        <ResetPasswordForm token={token} />
      </section>
    </main>
  );
}
