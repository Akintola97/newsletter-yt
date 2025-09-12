import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function HomeHero() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-6 px-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Welcome
        </h1>
        <p className="max-w-md mx-auto text-lg text-muted-foreground">
          AI News delivered straight to your inbox. Choose{" "}
          <span className="font-semibold">daily</span>,{" "}
          <span className="font-semibold">biweekly</span>, or{" "}
          <span className="font-semibold">monthly</span> updates.
        </p>
        <LoginLink className="inline-flex items-center px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200">
          Sign in with Kinde
        </LoginLink>
      </div>
    </main>
  );
}
