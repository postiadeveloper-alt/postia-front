export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-hero-glow opacity-10 blur-[120px] -z-10" />
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
