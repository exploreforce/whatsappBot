'use client';

import React, { useState, useEffect } from 'react';
import { useFetch, useApi } from '@/hooks/useApi';
import { botApi, servicesApi } from '@/utils/api';
import { BotConfig, PersonalityTone, Service, CreateServiceRequest } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import { 
  CogIcon, 
  SparklesIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  CurrencyEuroIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const personalityToneOptions: { value: PersonalityTone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formell und geschäftsmäßig' },
  { value: 'friendly', label: 'Freundlich', description: 'Warm und einladend' },
  { value: 'casual', label: 'Locker', description: 'Entspannt und ungezwungen' },
  { value: 'flirtatious', label: 'Flirtend', description: 'Charmant und spielerisch' },
  { value: 'direct', label: 'Direkt', description: 'Klar und auf den Punkt' },
  { value: 'emotional', label: 'Emotional', description: 'Empathisch und verständnisvoll' },
  { value: 'warm', label: 'Herzlich', description: 'Mitfühlend und unterstützend' },
  { value: 'confident', label: 'Selbstbewusst', description: 'Sicher und kompetent' },
  { value: 'playful', label: 'Verspielt', description: 'Humorvoll und leicht' }
];

const generateSystemPrompt = (config: Partial<BotConfig>): string => {
  const {
    botName = 'AI Assistant',
    botDescription = 'Ein hilfreicher AI-Assistent',
    personalityTone = 'friendly',
    characterTraits = 'Hilfsbereit, geduldig, verständnisvoll',
    backgroundInfo = 'Ich bin ein AI-Assistent',
    servicesOffered = 'Terminbuchung und Beratung',
    escalationRules = 'Bei komplexen Anfragen weiterleiten',
    botLimitations = 'Keine medizinischen oder rechtlichen Beratungen'
  } = config;

  const toneDescription = personalityToneOptions.find(opt => opt.value === personalityTone)?.description || 'freundlich';

  return `Du bist ${botName}, ${botDescription}.

PERSÖNLICHKEIT & TONALITÄT:
Du kommunizierst ${toneDescription} und verkörperst folgende Eigenschaften: ${characterTraits}.

HINTERGRUND:
${backgroundInfo}

ANGEBOTENE SERVICES:
${servicesOffered}

ESKALATIONSREGELN:
${escalationRules}

GRENZEN & EINSCHRÄNKUNGEN:
${botLimitations}

VERHALTEN:
- Antworte immer höflich und professionell
- Stelle bei Unklarheiten Rückfragen
- Verwende die verfügbaren Tools zur Terminbuchung
- Bleibe im Rahmen deiner definierten Services
- Leite entsprechend den Eskalationsregeln weiter

Für Terminbuchungen nutze die verfügbaren Tools: checkAvailability and bookAppointment.`;
};

const ServicesManagement = ({ botConfigId }: { botConfigId: string }) => {
  const { data: servicesData, isLoading, error, refetch } = useFetch(
    () => servicesApi.getAll(botConfigId),
    [botConfigId]
  );

  const { execute: createService, isLoading: isCreating } = useApi();
  const { execute: updateService, isLoading: isUpdating } = useApi(); 
  const { execute: deleteService, isLoading: isDeleting } = useApi();

  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateServiceRequest>({
    name: '',
    description: '',
    price: 0,
    currency: 'EUR',
    durationMinutes: 60
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (servicesData?.data) {
      setServices(servicesData.data);
    }
  }, [servicesData]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'EUR',
      durationMinutes: 60
    });
    setEditingService(null);
    setShowAddForm(false);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      currency: service.currency,
      durationMinutes: service.durationMinutes
    });
    setEditingService(service);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingService) {
        await updateService(() => servicesApi.update(editingService.id, formData));
      } else {
        await createService(() => servicesApi.create(botConfigId, formData));
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Service löschen möchten?')) {
      try {
        await deleteService(() => servicesApi.delete(serviceId));
        refetch();
      } catch (error) {
        console.error('Failed to delete service:', error);
      }
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Lade Services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <Alert type="success" message="Service erfolgreich gespeichert!" />
      )}

      {error && (
        <Alert type="error" message={`Fehler beim Laden der Services: ${error}`} />
      )}

      {/* Services List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CurrencyEuroIcon className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Services & Preise</h3>
            </div>
            <Button
              onClick={handleAdd}
              className="flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Service hinzufügen</span>
            </Button>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-8">
              <CurrencyEuroIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Services</h3>
              <p className="mt-1 text-sm text-gray-500">
                Fügen Sie Ihren ersten Service hinzu.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dauer
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {service.name}
                          </div>
                          {service.description && (
                            <div className="text-sm text-gray-500">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(service.price, service.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.durationMinutes ? (
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {service.durationMinutes} Min
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            onClick={() => handleEdit(service)}
                            variant="secondary"
                            className="p-2"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(service.id)}
                            variant="secondary"
                            className="p-2 text-red-600 hover:text-red-800"
                            disabled={isDeleting}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Service Form */}
      {showAddForm && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingService ? 'Service bearbeiten' : 'Neuen Service hinzufügen'}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Service Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Beratungsgespräch"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung (optional)
                </label>  
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kurze Beschreibung des Services..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Preis"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  required
                />
                
                <Select
                  label="Währung"
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  options={[
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'CHF', label: 'CHF' }
                  ]}
                />
                
                <Input
                  label="Dauer (Min)"
                  type="number"
                  min="0"
                  step="15"
                  value={formData.durationMinutes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || undefined }))}
                  placeholder="z.B. 60"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={resetForm}
                variant="secondary"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={isCreating || isUpdating || !formData.name}
              >
                {(isCreating || isUpdating) ? 'Speichere...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const BotConfigForm = () => {
  const { data: initialConfig, isLoading, error, refetch } = useFetch(
    () => botApi.getConfig(),
    []
  );

  const { execute: updateConfig, isLoading: isUpdating } = useApi();

  const [activeTab, setActiveTab] = useState<'config' | 'services'>('config');
  const [config, setConfig] = useState<Partial<BotConfig>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update config when data loads
  useEffect(() => {
    if (initialConfig?.data) {
      setConfig(initialConfig.data);
      const prompt = generateSystemPrompt(initialConfig.data);
      setGeneratedPrompt(prompt);
    }
  }, [initialConfig]);

  // Update generated prompt when config changes
  useEffect(() => {
    const prompt = generateSystemPrompt(config);
    setGeneratedPrompt(prompt);
  }, [config]);

  const handleInputChange = (field: keyof BotConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const configWithPrompt = {
        ...config,
        generatedSystemPrompt: generatedPrompt,
        systemPrompt: generatedPrompt // Update legacy field too
      };
      
      await updateConfig(() => botApi.updateConfig(configWithPrompt));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      refetch();
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Lade Konfiguration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" message={`Fehler beim Laden der Konfiguration: ${error}`} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CogIcon className="h-5 w-5" />
              <span>Bot-Konfiguration</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CurrencyEuroIcon className="h-5 w-5" />
              <span>Services & Preise</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {saveSuccess && (
            <Alert type="success" message="Bot-Konfiguration erfolgreich gespeichert!" />
          )}

      {/* Bot Identity Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Bot-Identität</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Bot Name"
              value={config.botName || ''}
              onChange={(e) => handleInputChange('botName', e.target.value)}
              placeholder="z.B. Dr. Schmidt's Assistent"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bot Beschreibung
              </label>
              <Textarea
                value={config.botDescription || ''}
                onChange={(e) => handleInputChange('botDescription', e.target.value)}
                placeholder="Kurze Beschreibung was der Bot tut und ist..."
                rows={3}
                required
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Personality Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Persönlichkeit & Tonalität</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tonalität
              </label>
              <Select
                value={config.personalityTone || 'friendly'}
                onChange={(e) => handleInputChange('personalityTone', e.target.value as PersonalityTone)}
                options={personalityToneOptions.map(option => ({
                  value: option.value,
                  label: `${option.label} - ${option.description}`
                }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Charaktereigenschaften
              </label>
              <Textarea
                value={config.characterTraits || ''}
                onChange={(e) => handleInputChange('characterTraits', e.target.value)}
                placeholder="z.B. Hilfsbereit, geduldig, verständnisvoll, professionell..."
                rows={2}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Background & Services Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <CogIcon className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Hintergrund & Services</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hintergrundinformationen
              </label>
              <Textarea
                value={config.backgroundInfo || ''}
                onChange={(e) => handleInputChange('backgroundInfo', e.target.value)}
                placeholder="Was soll der Bot über sich selbst wissen..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Angebotene Services
              </label>
              <Textarea
                value={config.servicesOffered || ''}
                onChange={(e) => handleInputChange('servicesOffered', e.target.value)}
                placeholder="z.B. Terminbuchung, Terminverwaltung, Informationen zu Verfügbarkeiten..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Rules & Limitations Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <SparklesIcon className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Regeln & Grenzen</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eskalationsregeln
              </label>
              <Textarea
                value={config.escalationRules || ''}
                onChange={(e) => handleInputChange('escalationRules', e.target.value)}
                placeholder="Wann soll die Antwort an Human-in-the-loop übergeben werden..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bot-Grenzen
              </label>
              <Textarea
                value={config.botLimitations || ''}
                onChange={(e) => handleInputChange('botLimitations', e.target.value)}
                placeholder="Was soll der Bot nicht machen..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* System Prompt Preview */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generierter System-Prompt</h3>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ausblenden' : 'Vorschau anzeigen'}
            </Button>
          </div>
          
          {showPreview && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>
      </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isUpdating}
              className="min-w-[200px]"
            >
              {isUpdating ? 'Speichere...' : 'Konfiguration speichern'}
            </Button>
          </div>
        </form>
      ) : (
        config.id ? (
          <ServicesManagement botConfigId={config.id} />
        ) : (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Lade Bot-Konfiguration...</span>
          </div>
        )
      )}
    </div>
  );
};

export default BotConfigForm; 