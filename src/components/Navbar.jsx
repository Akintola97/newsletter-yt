import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";
import { ModeToggle } from "./modeToggle";
import UserMenu from "./UserMenu";

export default async function Navbar() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = await isAuthenticated();
  const user = authed ? await getUser() : null;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-full items-center justify-between px-4">
        <Link
          href={authed ? "/dashboard" : "/"}
          prefetch={false}
          className="font-semibold tracking-tight"
        >
          Newsletter
        </Link>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu user={user} />
        </div>
      </div>
    </nav>
  );
}
