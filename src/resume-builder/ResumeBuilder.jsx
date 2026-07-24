import { useState } from 'react'
import { motion } from 'framer-motion'
import { ResumeProvider } from './resumeStore.jsx'
import ResumeForm     from './components/ResumeForm'
import ResumePreview  from './components/ResumePreview'
import TemplatePicker from './components/TemplatePicker'

const TABS = ['form', 'preview', 'templates']
const TAB_LABELS = { form: 'Details', preview: 'Preview', templates: 'Templates' }

export default function ResumeBuilder({ onPrint, onBack }) {
  const [mobileTab, setMobileTab] = useState('form')

  return (
    <ResumeProvider>
      <div className="flex flex-col h-full bg-[#FAFAFA]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-orange-100 flex-shrink-0 bg-white/90 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-[#F78C25] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <p className="text-[#222222] font-bold text-sm">Resume Builder</p>
              <p className="text-gray-400 text-xs hidden sm:block">Build · Preview · Print</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F78C25] animate-pulse" />
            <span className="text-[#F78C25] text-xs font-medium">Live Preview</span>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="flex lg:hidden border-b border-orange-100 flex-shrink-0 bg-white">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold transition-all ${
                mobileTab === tab
                  ? 'text-[#F78C25] border-b-2 border-[#F78C25] bg-orange-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'form' && '📝 '}
              {tab === 'preview' && '👁 '}
              {tab === 'templates' && '🎨 '}
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* 3-panel body */}
        <div className="flex flex-1 overflow-hidden">
          <div className={`${
            mobileTab === 'form' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-72 xl:w-80 flex-shrink-0 flex-col border-r border-orange-100 overflow-y-auto scrollbar-thin bg-white`}>
            <div className="p-4"><ResumeForm /></div>
          </div>
          <div className={`${
            mobileTab === 'preview' ? 'flex' : 'hidden'
          } lg:flex flex-1 flex-col overflow-hidden`}>
            <ResumePreview onPrint={onPrint} />
          </div>
          <div className={`${
            mobileTab === 'templates' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-56 xl:w-64 flex-shrink-0 flex-col border-l border-orange-100 overflow-y-auto scrollbar-thin bg-white`}>
            <div className="p-4"><TemplatePicker /></div>
          </div>
        </div>
      </div>
    </ResumeProvider>
  )
}
