import { useState } from 'react';
import { ParametrosFinancieros } from './configuracion/ParametrosFinancieros';
import { ConfiguracionGeneral } from './configuracion/ConfiguracionGeneral';
import { GestionPeriodos } from './configuracion/GestionPeriodos';
import { GestionCredenciales } from './configuracion/GestionCredenciales';
import { GestionUsuarios } from './configuracion/GestionUsuarios';

type Section = 'financiero' | 'periodos' | 'general' | 'usuarios' | 'credenciales';

const sections: { key: Section; label: string }[] = [
  { key: 'financiero', label: 'Parámetros Financieros' },
  { key: 'periodos', label: 'Gestión de Períodos' },
  { key: 'general', label: 'Configuración General' },
  { key: 'credenciales', label: 'Credenciales Socios' },
  { key: 'usuarios', label: 'Usuarios' },
];

export default function ConfiguracionPage() {
  const [activeSection, setActiveSection] = useState<Section>('financiero');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Panel de Administración</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
              activeSection === s.key
                ? 'bg-white text-navy-700 border border-b-white border-gray-200 -mb-px'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'financiero' && <ParametrosFinancieros />}
      {activeSection === 'periodos' && <GestionPeriodos />}
      {activeSection === 'general' && <ConfiguracionGeneral />}
      {activeSection === 'credenciales' && <GestionCredenciales />}
      {activeSection === 'usuarios' && <GestionUsuarios />}
    </div>
  );
}
