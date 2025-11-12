export default function Footer() {
    return (
        <footer className="w-full py-10 text-center text-gray-400 text-sm bg-black/40 backdrop-blur-md">
            © {new Date().getFullYear()} Quark. All rights reserved.
        </footer>
    );
}