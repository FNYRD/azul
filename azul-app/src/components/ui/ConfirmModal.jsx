import Modal from './Modal'

export default function ConfirmModal({ isOpen, message, onConfirm, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm">
      <div className="space-y-5">
        <p className="font-body text-ink text-base leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-2xl font-sans font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
