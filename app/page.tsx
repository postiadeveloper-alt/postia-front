import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-hero-glow opacity-20 blur-[100px] -z-10" />

            <div className="z-10 text-center space-y-8">
                <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-300">
                    Postia
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl">
                    La plataforma definitiva de gestión de redes sociales para agencias y creadores.
                    Programa, analiza y crece.
                </p>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/auth/login"
                        className="px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/25"
                    >
                        Comenzar
                    </Link>
                    <Link
                        href="/auth/register"
                        className="px-8 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10"
                    >
                        Registrarse
                    </Link>
                </div>
            </div>
        </main>
    );
}
