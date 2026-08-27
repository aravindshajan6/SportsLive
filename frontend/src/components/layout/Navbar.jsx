import { startTransition, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Home, Info, LogIn, LogOut, Menu, MessageSquareText, Newspaper, User, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext.jsx';
import Avatar from '@/components/ui/Avatar.jsx';
import ThemeToggle from '@/components/ui/ThemeToggle.jsx';
import Button from '@/components/ui/Button.jsx';
import BrandLogo from '@/components/ui/BrandLogo.jsx';
import styles from './Navbar.module.css';

const LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/matches', label: 'Matches', icon: CalendarDays, live: true },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/about', label: 'About', icon: Info },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // lock scroll when the drawer is open
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  // click-outside + Escape for the user menu
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    const onKey = (e) => e.key === 'Escape' && (setMenu(false), setDrawer(false));
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const closeAll = () => {
    setDrawer(false);
    setMenu(false);
  };

  const handleLogout = () => {
    closeAll();
    // Run the auth update and the navigation in one transition so ProtectedRoute
    // doesn't redirect to /login before we've left a protected page.
    startTransition(() => {
      logout();
      navigate('/');
    });
    toast.success('Signed out. See you soon!');
  };

  const linkClass = ({ isActive }) => [styles.link, isActive && styles.active].filter(Boolean).join(' ');
  const drawerLinkClass = ({ isActive }) => [styles.drawerLink, isActive && styles.active].filter(Boolean).join(' ');

  return (
    <header className={[styles.nav, scrolled && styles.scrolled].filter(Boolean).join(' ')}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand} aria-label="SportsLive home">
          <BrandLogo height={38} />
        </Link>

        <nav className={styles.links} aria-label="Primary">
          {LINKS.map(({ to, label, end, live }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} onClick={closeAll}>
              {live && <span className={styles.liveDot} aria-hidden="true" />}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          {isAuthenticated ? (
            <div className={styles.userWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.userBtn}
                onClick={() => setMenu((m) => !m)}
                aria-haspopup="menu"
                aria-expanded={menu}
              >
                <Avatar name={user.username} size={34} />
                <span className={styles.userName}>{user.username}</span>
              </button>
              {menu && (
                <div className={styles.menu} role="menu">
                  <div className={styles.menuHead}>Signed in as <strong>{user.username}</strong></div>
                  <Link to="/profile" className={styles.menuItem} role="menuitem" onClick={closeAll}>
                    <User size={16} /> My profile
                  </Link>
                  <Link to="/profile#comments" className={styles.menuItem} role="menuitem" onClick={closeAll}>
                    <MessageSquareText size={16} /> My comments
                  </Link>
                  <button type="button" className={`${styles.menuItem} ${styles.danger}`} role="menuitem" onClick={handleLogout}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button to={`/login?next=${encodeURIComponent(location.pathname)}`} variant="primary" size="sm">
              <LogIn size={15} /> Login
            </Button>
          )}
          <button
            type="button"
            className={styles.burger}
            onClick={() => setDrawer((d) => !d)}
            aria-label={drawer ? 'Close menu' : 'Open menu'}
            aria-expanded={drawer}
            aria-controls="mobile-drawer"
          >
            {drawer ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* mobile drawer — portaled to <body>: the header's backdrop-filter would otherwise become the
          containing block of this fixed layer and clip it to the navbar height */}
      {createPortal(
        <div className={[styles.drawerLayer, drawer && styles.drawerOpen].filter(Boolean).join(' ')}>
          <div className={styles.drawerBackdrop} onClick={() => setDrawer(false)} aria-hidden="true" />
          <nav id="mobile-drawer" className={styles.drawer} aria-label="Mobile" aria-hidden={!drawer}>
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={drawerLinkClass} tabIndex={drawer ? 0 : -1} onClick={closeAll}>
                <Icon size={20} /> {label}
              </NavLink>
            ))}
            <div className={styles.drawerFoot}>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className={styles.drawerUser} tabIndex={drawer ? 0 : -1} onClick={closeAll}>
                    <Avatar name={user.username} size={40} />
                    <span>
                      <strong>{user.username}</strong>
                      <small>{user.email}</small>
                    </span>
                  </Link>
                  <Button variant="secondary" onClick={handleLogout} block tabIndex={drawer ? 0 : -1}>
                    <LogOut size={16} /> Sign out
                  </Button>
                </>
              ) : (
                <Button to="/login" variant="gradient" block tabIndex={drawer ? 0 : -1} onClick={closeAll}>
                  <LogIn size={16} /> Login / Sign up
                </Button>
              )}
            </div>
          </nav>
        </div>,
        document.body,
      )}
    </header>
  );
}
