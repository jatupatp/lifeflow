import './FAB.css';

export default function FAB({ icon: Icon, onClick, label }) {
  return (
    <button
      className="fab"
      onClick={onClick}
      aria-label={label}
      type="button"
    >
      {Icon && <Icon size={24} />}
    </button>
  );
}
