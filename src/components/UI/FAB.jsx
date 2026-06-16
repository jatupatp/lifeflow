import './FAB.css';

export default function FAB({ icon, onClick, label }) {
  return (
    <button
      className="fab"
      onClick={onClick}
      aria-label={label}
      type="button"
    >
      {icon}
    </button>
  );
}
