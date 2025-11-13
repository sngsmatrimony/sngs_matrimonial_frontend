export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm-subtle p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
