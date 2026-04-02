import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/home"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="material-symbols-outlined">grid_view</span>
        <span className="nav-label">Home</span>
      </NavLink>

      <NavLink
        to="/scan"
        className="fab"
        style={{ marginTop: '-36px' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add_circle</span>
      </NavLink>

      <NavLink
        to="/data"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="material-symbols-outlined">history</span>
        <span className="nav-label">Ledger</span>
      </NavLink>

    </nav>
  );
}
