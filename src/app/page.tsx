import Nav from "@/components/Nav";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <Nav />
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-6 text-center">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            NextAuth Keycloak Example
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            This is a Next.js application integrated with Keycloak using OpenID
            Connect protocol via NextAuth.js.
          </p>
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Features
            </h2>
            <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
              <li>✅ Login with Keycloak (OIDC)</li>
              <li>✅ Federated logout</li>
              <li>✅ Protected routes</li>
              <li>✅ JWT session with automatic token refresh</li>
              <li>✅ Clean, maintainable structure</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
