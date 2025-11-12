import { type FunctionComponent, type PropsWithChildren, useEffect, useRef } from "react";
import Navbar, { type NavbarProps } from "./Navbar";
import Footer from "./Footer";

export interface PageProps extends PropsWithChildren, NavbarProps {
    title: string;
}

const Page: FunctionComponent<PageProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        document.title = props.title;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const resizeCanvas = () => {
            const parent = canvas.parentElement!;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };
        resizeCanvas();

        let width = canvas.width;
        let height = canvas.height;

        const particles = Array.from({ length: 60 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 1.5 + 0.5,
            dx: (Math.random() - 0.5) * 0.15,
            dy: (Math.random() - 0.5) * 0.15,
            hue: 200 + Math.random() * 60,
        }));

        const symbols = ["π", "Σ", "∫", "Δ", "λ", "Ψ", "ƒ", "∞", "√", "∂"];
        const textParticles = Array.from({ length: 15 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            dy: 0.05 + Math.random() * 0.1,
            text: symbols[Math.floor(Math.random() * symbols.length)],
            opacity: 0.05 + Math.random() * 0.2,
        }));

        const draw = () => {
            // always get updated dimensions in case content grows
            width = canvas.width;
            height = canvas.height;

            ctx.fillStyle = "rgba(10, 10, 25, 1)";
            ctx.fillRect(0, 0, width, height);

            for (const p of particles) {
                p.x += p.dx;
                p.y += p.dy;
                if (p.x < 0 || p.x > width) p.dx *= -1;
                if (p.y < 0 || p.y > height) p.dy *= -1;

                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
                gradient.addColorStop(0, `hsla(${p.hue}, 90%, 75%, 0.4)`);
                gradient.addColorStop(1, `hsla(${p.hue}, 90%, 75%, 0)`);

                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.font = "2rem 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            for (const t of textParticles) {
                t.y -= t.dy;
                if (t.y < -20) t.y = height + 20;
                ctx.fillStyle = `rgba(200, 220, 255, ${t.opacity})`;
                ctx.shadowColor = "rgba(180, 200, 255, 0.4)";
                ctx.shadowBlur = 10;
                ctx.fillText(t.text, t.x, t.y);
                ctx.shadowBlur = 0;
            }

            requestAnimationFrame(draw);
        };
        draw();

        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [props.title]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden text-white">
            {/* --- Gradient base --- */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-blue-900 to-purple-900" />

            {/* --- Canvas for motion background --- */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* --- Soft glowing blobs --- */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-[50rem] h-[50rem] bg-indigo-500/10 rounded-full blur-3xl animate-[drift1_40s_infinite] top-[-20%] left-[-10%]" />
                <div className="absolute w-[50rem] h-[50rem] bg-purple-600/10 rounded-full blur-3xl animate-[drift2_50s_infinite] bottom-[-20%] right-[-10%]" />
            </div>

            {/* --- Foreground content --- */}
            <div className="relative z-10">
                <Navbar userSession={props.userSession} setUserSession={props.setUserSession} />
                {props.children}
                <Footer />
            </div>
            
        </div>
    );
};

export default Page;
