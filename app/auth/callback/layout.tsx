// Bypass the parent auth layout's max-w-md constraint for the callback page
export default function CallbackLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
