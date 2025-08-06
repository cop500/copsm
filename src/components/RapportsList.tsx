'use client';

import React, { useState } from 'react';
import { useRapports, Rapport } from '@/hooks/useRapports';
import { 
  FileText, 
  MessageSquare, 
  Zap, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar,
  Download,
  Printer,
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface RapportsListProps {
  evenementId: string;
  evenementTitre: string;
}

export const RapportsList: React.FC<RapportsListProps> = ({ 
  evenementId, 
  evenementTitre 
}) => {
  const { rapports, loading, error, updateRapport, deleteRapport } = useRapports(evenementId);
  const [editingRapport, setEditingRapport] = useState<Rapport | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitre, setEditTitre] = useState('');
  const [showRapport, setShowRapport] = useState<Rapport | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rapport': return <FileText className="w-4 h-4" />;
      case 'compte-rendu': return <MessageSquare className="w-4 h-4" />;
      case 'flash-info': return <Zap className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rapport': return 'Rapport';
      case 'compte-rendu': return 'Compte-rendu';
      case 'flash-info': return 'Flash info';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = (rapport: Rapport) => {
    setEditingRapport(rapport);
    setEditContent(rapport.contenu);
    setEditTitre(rapport.titre_rapport || '');
  };

  const handleSaveEdit = async () => {
    if (!editingRapport) return;

    const result = await updateRapport(editingRapport.id, {
      contenu: editContent,
      titre_rapport: editTitre
    });

    if (result.success) {
      setEditingRapport(null);
      setEditContent('');
      setEditTitre('');
    }
  };

  const handleDelete = async (rapportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return;

    await deleteRapport(rapportId);
  };

  const handlePrint = (rapport: Rapport) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${rapport.titre_rapport || 'Rapport'}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .content { white-space: pre-wrap; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${rapport.titre_rapport || 'Rapport'}</h1>
              <p><strong>Événement:</strong> ${evenementTitre}</p>
              <p><strong>Type:</strong> ${getTypeLabel(rapport.type_rapport)}</p>
              <p><strong>Date de génération:</strong> ${formatDate(rapport.date_generation)}</p>
            </div>
            <div class="content">${rapport.contenu}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // Vous pourriez ajouter une notification ici
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des rapports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Erreur lors du chargement des rapports</p>
      </div>
    );
  }

  if (rapports.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rapport sauvegardé</h3>
        <p className="text-gray-600">Les rapports générés apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Rapports sauvegardés ({rapports.length})
      </h3>

      {rapports.map((rapport) => (
        <div key={rapport.id} className="bg-white border border-gray-200 rounded-lg p-4">
          {editingRapport?.id === rapport.id ? (
            // Mode édition
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitre">Titre du rapport</Label>
                <Input
                  id="editTitre"
                  value={editTitre}
                  onChange={(e) => setEditTitre(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editContent">Contenu</Label>
                <Textarea
                  id="editContent"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setEditingRapport(null);
                    setEditContent('');
                    setEditTitre('');
                  }}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button onClick={handleSaveEdit}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          ) : (
            // Mode affichage
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(rapport.type_rapport)}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {rapport.titre_rapport || `${getTypeLabel(rapport.type_rapport)} - ${evenementTitre}`}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(rapport.date_generation)}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {getTypeLabel(rapport.type_rapport)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setShowRapport(rapport)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Voir
                  </Button>
                  <Button
                    onClick={() => handleEdit(rapport)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    Modifier
                  </Button>
                  <Button
                    onClick={() => handleDelete(rapport.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Modal pour afficher un rapport */}
      {showRapport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {getTypeIcon(showRapport.type_rapport)}
                  {showRapport.titre_rapport || `${getTypeLabel(showRapport.type_rapport)} - ${evenementTitre}`}
                </h2>
                <Button
                  onClick={() => setShowRapport(null)}
                  variant="outline"
                  size="sm"
                >
                  Fermer
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {showRapport.contenu}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => handleCopy(showRapport.contenu)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copier
                </Button>
                <Button
                  onClick={() => handlePrint(showRapport)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </Button>
                <Button
                  onClick={() => setShowRapport(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 