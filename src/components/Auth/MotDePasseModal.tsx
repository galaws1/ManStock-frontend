import { useStock } from '../../context/StockContext';
import { Modal } from '../common/Modal';
import { MotDePasseForm } from './MotDePasseForm';

/** Changement volontaire depuis le menu « Mon mot de passe ». */
export function MotDePasseModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useStock();
  return (
    <Modal titre="Modifier mon mot de passe" onClose={onClose} largeur="sm">
      <MotDePasseForm
        onSucces={() => {
          showToast('Mot de passe modifié');
          onClose();
        }}
        actionsSecondaires={
          <button type="button" className="btn-secondaire" onClick={onClose}>
            Annuler
          </button>
        }
      />
    </Modal>
  );
}
