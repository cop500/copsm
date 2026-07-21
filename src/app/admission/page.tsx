'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PenLine, Video, Mail, ClipboardList, Loader2, Columns3 } from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import NoteConcoursModule from '@/components/NoteConcoursModule'
import VideoPreselectionModule from '@/components/VideoPreselectionModule'
import EmailContactsModule from '@/components/EmailContactsModule'
import CanevasModule from '@/components/CanevasModule'

type AdmissionTab = 'notes' | 'videos' | 'contacts-email' | 'canevas'

const ADMISSION_TAB_KEY = 'admission_activeTab'
const VALID_TABS = new Set<string>(['notes', 'videos', 'contacts-email', 'canevas'])

export default function AdmissionPage() {
  const router = useRouter()
  const { isAdmin, isManager } = useRole()
  const canAccessVideoNotes = isAdmin || isManager
  const canAccessContactsEmail = isAdmin
  const canAccessAdmission = canAccessVideoNotes || canAccessContactsEmail

  const [activeTab, setActiveTabState] = useState<AdmissionTab>('notes')
  const [notesModuleMounted, setNotesModuleMounted] = useState(false)
  const [canevasModuleMounted, setCanevasModuleMounted] = useState(false)
  const [ready, setReady] = useState(false)

  const setActiveTab = useCallback((tab: AdmissionTab) => {
    setActiveTabState(tab)
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ADMISSION_TAB_KEY, tab)
    const url = new URL(window.location.href)
    if (tab === 'notes') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }, [])

  useEffect(() => {
    if (!canAccessAdmission) {
      router.replace('/stagiaires')
      return
    }

    if (typeof window === 'undefined') return
    const fromUrl = new URLSearchParams(window.location.search).get('tab')
    const fromStorage = window.localStorage.getItem(ADMISSION_TAB_KEY)
    let candidate = (fromUrl || fromStorage || 'notes') as AdmissionTab
    if (!VALID_TABS.has(candidate)) candidate = 'notes'
    if (candidate === 'contacts-email' && !canAccessContactsEmail) candidate = 'notes'
    if ((candidate === 'notes' || candidate === 'videos' || candidate === 'canevas') && !canAccessVideoNotes) {
      candidate = canAccessContactsEmail ? 'contacts-email' : 'notes'
    }
    setActiveTabState(candidate)
    setReady(true)
  }, [canAccessAdmission, canAccessContactsEmail, canAccessVideoNotes, router])

  useEffect(() => {
    if (activeTab === 'notes') setNotesModuleMounted(true)
    if (activeTab === 'canevas') setCanevasModuleMounted(true)
  }, [activeTab])

  useEffect(() => {
    if (!ready || !canAccessAdmission) return
    if (activeTab === 'contacts-email' && !canAccessContactsEmail) setActiveTab('notes')
    if ((activeTab === 'notes' || activeTab === 'videos' || activeTab === 'canevas') && !canAccessVideoNotes) {
      if (canAccessContactsEmail) setActiveTab('contacts-email')
    }
  }, [
    activeTab,
    canAccessAdmission,
    canAccessContactsEmail,
    canAccessVideoNotes,
    ready,
    setActiveTab,
  ])

  if (!canAccessAdmission || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-100 rounded-xl">
              <ClipboardList className="w-7 h-7 text-violet-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admission</h1>
              <p className="text-gray-600">
                Notes concours, vidéos, canevas d&apos;export et contacts e-mail
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6 -mx-1 px-1 overflow-x-auto">
          <nav className="-mb-px flex flex-nowrap sm:flex-wrap gap-x-6 gap-y-1 min-w-max sm:min-w-0">
            {canAccessVideoNotes && (
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'notes'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <PenLine className="w-5 h-5" />
                  <span>NOTE</span>
                </div>
              </button>
            )}

            {canAccessVideoNotes && (
              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'videos'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Vidéo</span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                    Beta
                  </span>
                </div>
              </button>
            )}

            {canAccessVideoNotes && (
              <button
                type="button"
                onClick={() => setActiveTab('canevas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'canevas'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Columns3 className="w-5 h-5" />
                  <span>Canevas</span>
                </div>
              </button>
            )}

            {canAccessContactsEmail && (
              <button
                type="button"
                onClick={() => setActiveTab('contacts-email')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'contacts-email'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Contacts e-mail</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {notesModuleMounted && canAccessVideoNotes && (
          <div className={activeTab === 'notes' ? '' : 'hidden'}>
            <NoteConcoursModule isActive={activeTab === 'notes'} />
          </div>
        )}

        {activeTab === 'videos' && canAccessVideoNotes && <VideoPreselectionModule />}

        {canevasModuleMounted && canAccessVideoNotes && (
          <div className={activeTab === 'canevas' ? '' : 'hidden'}>
            <CanevasModule isActive={activeTab === 'canevas'} />
          </div>
        )}

        {activeTab === 'contacts-email' && canAccessContactsEmail && <EmailContactsModule />}
      </div>
    </div>
  )
}
