import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppMode } from '../contexts/AppModeContext'
import type { Store, Service } from '../types'
import { 
  ClipboardDocumentIcon, 
  ShareIcon, 
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid'
import { initTelegram } from '../lib/telegram'

interface PersonalLinksProps {
  stores: Store[]
  services: Service[]
  hasListings: boolean
  botUsername?: string
}

export default function PersonalLinks({ stores, services, hasListings, botUsername = 'UZCHAT24BOT' }: PersonalLinksProps) {
  const navigate = useNavigate()
  const { setAppMode } = useAppMode()
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showHowToInstall, setShowHowToInstall] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(text)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleShare = (link: string, title: string) => {
    const webApp = initTelegram()
    if (webApp) {
      webApp.sendData(JSON.stringify({
        type: 'share',
        text: `${title}\n\n${link}`
      }))
    } else {
      handleCopy(link)
    }
  }

  const handlePreview = (type: 'store' | 'service', id: string) => {
    if (type === 'store') {
      setAppMode({ kind: 'store', storeId: id })
    } else {
      setAppMode({ kind: 'service', serviceId: id })
    }
    navigate('/?ctx=' + type + ':' + id)
  }

  const generateStoreLink = (store: Store) => {
    if (store.referral_code) {
      return `https://t.me/${botUsername}?start=${store.referral_code}`
    }
    return `https://t.me/${botUsername}?start=store_${store.store_id}`
  }

  const generateServiceLink = (serviceId: string) => {
    return `https://t.me/${botUsername}?start=service_${serviceId}`
  }

  // Apple-style compact design
  return (
    <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Compact Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Mijozlarga ulashish</h3>
        <p className="text-xs text-gray-500 mt-0.5">Shaxsiy linklar</p>
      </div>

      {/* Store Link - Compact */}
      {stores.length > 0 && stores[0] ? (
        <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <BuildingStorefrontIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{stores[0].name}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">Do'kon linki</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => handleCopy(generateStoreLink(stores[0]))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Nusxa olish"
              >
                {copiedLink === generateStoreLink(stores[0]) ? (
                  <CheckIconSolid className="w-4 h-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => handleShare(generateStoreLink(stores[0]), `🛍 ${stores[0].name} do'koni`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ulashish"
              >
                <ShareIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePreview('store', stores[0].store_id)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ko'rish"
              >
                <EyeIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => navigate('/create-store')}
            className="w-full flex items-center gap-3 text-left hover:bg-gray-50/50 rounded-lg p-2 -m-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <BuildingStorefrontIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Do'kon yaratish</p>
              <p className="text-xs text-gray-500 mt-0.5">Shaxsiy link olish uchun</p>
            </div>
          </button>
        </div>
      )}

      {/* Service Link - Compact */}
      {services.length > 0 ? (
        <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <WrenchScrewdriverIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Xizmatlar</p>
                <p className="text-xs text-gray-500 mt-0.5">{services.length} ta xizmat</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => handleCopy(generateServiceLink(services[0].service_id))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Nusxa olish"
              >
                {copiedLink === generateServiceLink(services[0].service_id) ? (
                  <CheckIconSolid className="w-4 h-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => handleShare(generateServiceLink(services[0].service_id), '🛠 Xizmatlarim')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ulashish"
              >
                <ShareIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePreview('service', services[0].service_id)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ko'rish"
              >
                <EyeIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => navigate('/create-service')}
            className="w-full flex items-center gap-3 text-left hover:bg-gray-50/50 rounded-lg p-2 -m-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Xizmat yaratish</p>
              <p className="text-xs text-gray-500 mt-0.5">Shaxsiy link olish uchun</p>
            </div>
          </button>
        </div>
      )}

      {/* Compact Accordions */}
      <div className="border-t border-gray-100">
        {/* How It Works - Minimal */}
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">Qanday ishlaydi?</span>
          {showHowItWorks ? (
            <ChevronUpIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {showHowItWorks && (
          <div className="px-4 pb-3 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-gray-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-700 font-medium flex items-center justify-center text-[10px] mt-0.5">1</span>
              <p>Linkni nusxalang va kanal/bio/story'ga joylang</p>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-gray-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-700 font-medium flex items-center justify-center text-[10px] mt-0.5">2</span>
              <p>Mijoz linkni bossa → bot'ga o'tadi</p>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-gray-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-700 font-medium flex items-center justify-center text-[10px] mt-0.5">3</span>
              <p>Bot'da "Do'konni Ochish" tugmasini bosing → Mini App ochiladi</p>
            </div>
          </div>
        )}

        {/* How To Install - Minimal */}
        <button
          onClick={() => setShowHowToInstall(!showHowToInstall)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors border-t border-gray-100"
        >
          <span className="text-sm font-medium text-gray-700">Qanday o'rnataman?</span>
          {showHowToInstall ? (
            <ChevronUpIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {showHowToInstall && (
          <div className="px-4 pb-3 space-y-3 text-xs text-gray-600">
            <div>
              <p className="font-medium text-gray-900 mb-1">📌 Kanal</p>
              <p className="ml-1">Post'ga link qo'yib pin qiling</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">📝 Bio</p>
              <p className="ml-1">Kanal description'ga link qo'ying</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">📸 Story</p>
              <p className="ml-1">Story'ga link + CTA qo'ying</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
