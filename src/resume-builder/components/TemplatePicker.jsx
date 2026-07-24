import { useResume } from '../resumeStore.jsx'
import { TEMPLATES } from '../templates'

export default function TemplatePicker() {
  const { resume, setTemplate } = useResume()

  return (
    <div className="space-y-2">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Templates</p>
      {TEMPLATES.map(tpl => (
        <button
          key={tpl.id}
          onClick={() => setTemplate(tpl.id)}
          className={`w-full text-left p-3 rounded-xl border transition-all ${
            resume.template === tpl.id
              ? 'border-[#F78C25] bg-orange-50'
              : 'border-orange-100 bg-white hover:border-orange-200'
          }`}
        >
          {/* Mini color swatch */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tpl.accent }} />
            <span className={`text-xs font-semibold ${resume.template === tpl.id ? 'text-[#F78C25]' : 'text-[#222222]'}`}>
              {tpl.label}
            </span>
            {resume.template === tpl.id && (
              <span className="ml-auto text-[#F78C25] text-xs">✓</span>
            )}
          </div>
          <p className="text-[#6B7280] text-xs leading-relaxed">{tpl.desc}</p>
        </button>
      ))}

      {/* ATS tip */}
      <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
        <p className="text-green-600 text-xs font-semibold mb-1">💡 ATS Tip</p>
        <p className="text-[#6B7280] text-xs leading-relaxed">
          Use <span className="text-green-600">Minimal ATS</span> template when applying to large companies with automated screening.
        </p>
      </div>
    </div>
  )
}
