import { Link, useLocation } from 'react-router-dom'

// The Kin wordmark: K · [family tree] · N — the tree stands in for the "I".
// Drawn entirely in currentColor (set to the theme accent in CSS), so it
// recolors automatically with every theme. The canopy is layered translucent
// circles for depth; the trunk + splayed roots are solid.
function TreeMark() {
  return (
    <svg className="kin-logo-tree" viewBox="0 0 40 64" aria-hidden="true">
      {/* canopy — overlapping circles, low opacity so overlaps read as depth */}
      <circle cx="20" cy="23" r="12" opacity="0.5" />
      <circle cx="10.5" cy="25" r="10.5" opacity="0.5" />
      <circle cx="29.5" cy="25" r="10.5" opacity="0.5" />
      <circle cx="14.5" cy="16" r="9.5" opacity="0.7" />
      <circle cx="25.5" cy="16" r="9.5" opacity="0.7" />
      {/* pale highlight at the top (lighter simply by being more transparent) */}
      <circle cx="20" cy="12.5" r="8" opacity="0.3" />
      {/* trunk */}
      <rect x="17" y="24" width="6" height="28" rx="3" />
      {/* splayed roots */}
      <path
        className="kin-logo-roots"
        d="M20 50 L10 62 M20 50 L20 63 M20 50 L30 62"
      />
    </svg>
  )
}

export default function KinLogo({ size = 'sm', to, animate = true }) {
  // Keying the mark on the current path remounts it on every navigation, so
  // the (play-once) rise/grow animation restarts each time the user changes
  // pages — exactly the requested behavior.
  const { pathname } = useLocation()

  // The rise/grow entrance animation assumes it's visible the moment it
  // mounts. Instances that mount off-screen (e.g. in a footer far below the
  // fold) can get stuck mid-animation -- browsers may not tick a CSS
  // animation forward for an element that's not yet in the viewport, so it
  // never reaches its "to" keyframe. animate=false skips the animation
  // entirely and just renders the finished state.
  const mark = (
    <span className={`kin-logo kin-logo--${size} ${animate ? '' : 'kin-logo--static'}`} key={animate ? pathname : 'static'} aria-hidden="true">
      <span className="kin-logo-letter kin-logo-k">K</span>
      <TreeMark />
      <span className="kin-logo-letter kin-logo-n">N</span>
    </span>
  )

  if (to) {
    return (
      <Link to={to} className="kin-logo-link" aria-label="Kin">
        {mark}
      </Link>
    )
  }
  return (
    <span className="kin-logo-link" role="img" aria-label="Kin">
      {mark}
    </span>
  )
}
