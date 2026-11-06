export default function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-pink-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`modal-panel w-full ${wide ? 'max-w-2xl' : 'max-w-md'} overflow-hidden rounded-3xl bg-white shadow-2xl shadow-pink-900/30 ring-1 ring-pink-200`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between bg-gradient-to-l from-pink-400 to-rose-300 px-6 py-4 text-white">
          <h2 className="font-display text-lg font-extrabold">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-xl leading-none transition hover:bg-white/35"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
