import { useState } from 'react';
import { Settings } from 'lucide-react';
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
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gray-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-500/25">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Panel de Administración</h1>
          <p className="text-sm text-gray-500">Configuración del sistema</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {sections.map((s) => (
          <button
            type="button"
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all rounded-xl whitespace-nowrap ${
              activeSection === s.key
                ? 'bg-gradient-to-r from-slate-700 to-slate-500 text-white shadow-md'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-slate-700'
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
