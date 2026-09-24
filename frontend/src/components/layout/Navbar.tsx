import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link to="/" className="text-lg font-bold text-slate-800">
        Meeting Room Intelligence
      </Link>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span>Signed out</span>
      </div>
    </header>
  );
};