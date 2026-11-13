import { useEffect, useState } from 'react'
import { ArrowRight, Building2, Map, MapPin, Phone } from 'lucide-react'
import { Reveal, RevealItem, StaggeredGrid } from './Reveal'
import {
  getPublicBranches,
  type PublicBranch,
  type PublicSiteContent,
} from '../services/api'
import hyderabadImage from '../assets/branches/hyderabad-city.jpg'
import rajahmundryImage from '../assets/branches/rajahmundry-river.jpg'
import visakhapatnamImage from '../assets/branches/visakhapatnam-coast.jpg'
import vijayawadaImage from '../assets/branches/vijayawada-river.jpg'

interface Branch extends PublicBranch {
  id: string
  name: string
  imageAlt: string
  mapUrl: string
  description?: string
  mapPosition?: { x: number; y: number }
  order?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

const getBranchId = (city: string) =>
  city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const LOCAL_BRANCH_IMAGES: Record<string, string> = {
  rajahmundry: rajahmundryImage,
  hyderabad: hyderabadImage,
  visakhapatnam: visakhapatnamImage,
  vijayawada: vijayawadaImage,
}

const DEFAULT_BRANCHES: Branch[] = [
  {
    _id: 'default-rajahmundry',
    id: 'rajahmundry',
    city: 'Rajahmundry',
    name: 'Rajahmundry',
    isHeadquarters: true,
    region: 'Rajamahendravaram, Andhra Pradesh',
    address:
      '3rd Floor,BVR Enclave , Above Yamaha Showroom,Morampudi, Rajamahendravaram,AP 533103.',
    phones: ['+91 7799 822 811', '+91 8688 883 323'],
    imageUrl: rajahmundryImage,
    imageAlt:
      'Godavari river arch bridge in Rajahmundry at sunset, representing the headquarters location.',
    lat: 17.0005,
    lng: 81.804,
    openTime: '09:00',
    closeTime: '18:00',
    mapPosition: { x: 52, y: 73 },
    order: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=3rd%20Floor%2CBVR%20Enclave%20%2C%20Above%20Yamaha%20Showroom%2CMorampudi%2C%20Rajamahendravaram%2CAP%20533103.',
  },
  {
    _id: 'default-hyderabad',
    id: 'hyderabad',
    city: 'Hyderabad',
    name: 'Hyderabad',
    isHeadquarters: false,
    region: 'Gachibowli, Hyderabad, Telangana',
    address: 'Meenakshi Tech Park, Gachibowli, Hyderabad, Telangana',
    phones: ['+91 7799 822744'],
    imageUrl: hyderabadImage,
    imageAlt:
      'Hyderabad HITEC city and tech park skyline representing the Hyderabad branch.',
    lat: 17.4435,
    lng: 78.3575,
    openTime: '09:00',
    closeTime: '18:00',
    mapPosition: { x: 44, y: 64 },
    order: 2,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Meenakshi%20Tech%20Park%2C%20Gachibowli%2C%20Hyderabad%2C%20Telangana',
  },
  {
    _id: 'default-visakhapatnam',
    id: 'visakhapatnam',
    city: 'Visakhapatnam',
    name: 'Visakhapatnam',
    isHeadquarters: false,
    region: 'Yendada, Visakhapatnam, Andhra Pradesh',
    address:
      'KP ICON,opp.MK Gold Coast,Yendada,Visakhapatnam,Andhra Pradesh',
    phones: ['+91 81216 72244'],
    imageUrl: visakhapatnamImage,
    imageAlt:
      'Visakhapatnam coastline and hills representing the Visakhapatnam branch.',
    lat: 17.7664,
    lng: 83.3444,
    openTime: '09:00',
    closeTime: '18:00',
    mapPosition: { x: 58, y: 68 },
    order: 3,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=KP%20ICON%2Copp.MK%20Gold%20Coast%2CYendada%2CVisakhapatnam%2CAndhra%20Pradesh',
  },
  {
    _id: 'default-vijayawada',
    id: 'vijayawada',
    city: 'Vijayawada',
    name: 'Vijayawada',
    isHeadquarters: false,
    region: 'Vijayawada, Andhra Pradesh',
    address: 'Vijayawada, Andhra Pradesh',
    phones: ['+91 7799 822 811'],
    imageUrl: vijayawadaImage,
    imageAlt:
      'Prakasam Barrage and Krishna river in Vijayawada representing the Vijayawada branch.',
    lat: 16.5062,
    lng: 80.648,
    openTime: '09:00',
    closeTime: '18:00',
    mapPosition: { x: 50, y: 70 },
    order: 4,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Vijayawada%2C%20Andhra%20Pradesh',
  },
]

const isOpenAtLocalTime = (branch: PublicBranch, now: Date) => {
  const toMinutes = (time: string) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
    return match ? Number(match[1]) * 60 + Number(match[2]) : null
  }
  const open = toMinutes(branch.openTime)
  const close = toMinutes(branch.closeTime)
  if (open === null || close === null) return null

  const current = now.getHours() * 60 + now.getMinutes()
  return open <= close
    ? current >= open && current < close
    : current >= open || current < close
}

function BranchCard({ branch, now }: { branch: Branch; now: Date }) {
  const [imageFailed, setImageFailed] = useState(false)
  const isOpen = isOpenAtLocalTime(branch, now)

  return (
    <RevealItem className="branch-card">
      <div className="branch-card__photo">
        {imageFailed ? (
          <div className="branch-card__photo-fallback" aria-hidden="true">
            <Building2 size={32} />
            <span>Location image unavailable</span>
          </div>
        ) : (
          <img
            src={branch.imageUrl}
            alt={branch.imageAlt}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        {branch.isHeadquarters && (
          <span className="branch-card__hq-badge">Headquarters</span>
        )}
        <div className="branch-card__wave" aria-hidden="true">
          <svg viewBox="0 0 640 48" preserveAspectRatio="none">
            <path d="M0 25C110 5 190 44 320 24S535 7 640 25V48H0Z" />
          </svg>
        </div>
      </div>
      <div className="branch-card__content">
        <div className="branch-card__heading">
          <span className="branch-card__pin">
            <MapPin size={19} aria-hidden="true" />
          </span>
          <div>
            <h3>{branch.city || branch.name}</h3>
            <span>{branch.region}</span>
            {isOpen !== null && (
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isOpen
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  aria-hidden="true"
                />
                {isOpen ? 'Open now' : 'Closed'}
              </span>
            )}
          </div>
        </div>

        {branch.description && (
          <p className="branch-card__description">{branch.description}</p>
        )}

        <div className="branch-card__address">
          <div className="branch-card__address-label">
            <MapPin size={13} aria-hidden="true" />
            <span>ADDRESS</span>
          </div>
          <address>{branch.address}</address>
        </div>

        {branch.phones && branch.phones.length > 0 && (
          <div className="branch-card__phones">
            <Phone size={14} className="branch-card__phone-icon" aria-hidden="true" />
            <div className="branch-card__phone-list">
              {branch.phones.map((phone, idx) => (
                <span key={phone} className="branch-card__phone-item">
                  <a
                    className="branch-card__phone-link"
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  >
                    {phone}
                  </a>
                  {idx < branch.phones.length - 1 && (
                    <span className="branch-card__phone-sep">, </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="branch-card__image-note">
          Representative location image; not the office premises.
        </p>

        <a
          className="branch-card__map-link"
          href={branch.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${branch.city || branch.name} on Google Maps (opens in a new tab)`}
        >
          <Map size={15} aria-hidden="true" />
          <span>View on Map</span>
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
    </RevealItem>
  )
}

export default function Branches({
  branchOverrides,
}: {
  branchOverrides?: PublicSiteContent['branches']
}) {
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let active = true
    getPublicBranches()
      .then((result) => {
        if (!active || !Array.isArray(result) || result.length === 0) return
        const mapped: Branch[] = result.map((branch) => {
          const id = getBranchId(branch.city)
          const localImg = LOCAL_BRANCH_IMAGES[id]
          const isUnsplash = branch.imageUrl?.includes('unsplash.com')
          return {
            ...branch,
            id,
            name: branch.city,
            imageUrl: (!isUnsplash && branch.imageUrl) ? branch.imageUrl : (localImg || branch.imageUrl),
            imageAlt: `Representative city view for ${branch.city}, not a photograph of the branch premises.`,
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              branch.address,
            )}`,
          }
        })
        setBranches(mapped)
      })
      .catch((cause: unknown) => {
        console.warn('Backend branches API unavailable, showing verified locations:', cause)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const resolvedBranches = branches.map((branch) => {
    const override = branchOverrides?.find((item) => item.id === branch.id)
    if (!override) return branch
    return {
      ...branch,
      name: override.name || branch.name,
      region: override.region || branch.region,
      description: override.description || branch.description,
      address: override.address || branch.address,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        override.address || branch.address,
      )}`,
    }
  })

  return (
    <section className="section branches-section" id="branches" aria-labelledby="branches-title">
      <div className="container branches-container">
        <Reveal className="section-heading section-heading--center branches-heading">
          <span className="eyebrow">OUR LOCATIONS</span>
          <h2 id="branches-title">Local teams, one shared commitment.</h2>
          <p>
            Find Godavari Wave Technologies across Hyderabad, Rajamahendravaram, Visakhapatnam, and Vijayawada.
          </p>
        </Reveal>
        <StaggeredGrid className="branches-grid">
          {resolvedBranches.map((branch) => (
            <BranchCard branch={branch} key={branch._id || branch.id} now={now} />
          ))}
        </StaggeredGrid>
      </div>
    </section>
  )
}
