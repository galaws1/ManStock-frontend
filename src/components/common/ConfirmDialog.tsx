import { useState } from 'react';
import { Modal } from './Modal';

interface Props {
  titre: string;
  message: string;
  libelleConfirmer: string;
  danger?: boolean;
  /** Simple message : un seul bouton, pas d'« Annuler ». */
  information?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDialog({ titre, message, libelleConfirmer, danger = false, information = false, onConfirm, onClose }: Props) {
  const [enCours, setEnCours] = useState(false);

  const confirmer = async () => {
    setEnCours(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      titre={titre}
      onClose={onClose}
      largeur="sm"
      pied={
        <>
          {!information && (
            <button className="btn-secondaire" onClick={onClose} disabled={enCours}>
              Annuler
            </button>
          )}
          <button className={danger ? 'btn-danger' : 'btn-primaire'} onClick={confirmer} disabled={enCours}>
            {enCours ? 'Patientez…' : libelleConfirmer}
          </button>
        </>
      }
    >
      <p className="text-sm text-encre-douce">{message}</p>
    </Modal>
  );
}
