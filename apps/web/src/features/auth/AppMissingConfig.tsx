import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@reusables/design-system";

export function AppMissingConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Badge variant="warning" className="w-fit">
            Setup Required
          </Badge>
          <CardTitle>Missing Clerk publishable key</CardTitle>
          <CardDescription>
            Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to your environment before running the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-[#1a1a1a]">
          <p>The reusable auth package is wired in, but it needs a valid Clerk key to start.</p>
          <pre className="overflow-x-auto border-2 border-[#1a1a1a] bg-[#e8e8e0] p-4 font-mono text-xs">
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
