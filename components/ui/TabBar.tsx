'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, MessageCircle, UserRound, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BrandMark } from '@/components/ui/BrandLogo'

type TabId = 'home' | 'sarathy' | 'circles' | 'story' | 'profile'

interface Props {
  active?: TabId
}

const tabs: Array<{ id: TabId; href: string; label: string; icon: LucideIcon }> = [
  { id: 'home', href: '/app/home', label: 'Today', icon: Home },
  { id: 'circles', href: '/app/circles', label: 'Circles', icon: UsersRound },
  { id: 'sarathy', href: '/app/sarathy', label: 'Sarathy', icon: MessageCircle },
  { id: 'story', href: '/app/story', label: 'Story', icon: BookOpen },
  { id: 'profile', href: '/app/profile', label: 'Profile', icon: UserRound },
]

function getActiveTab(pathname: string): TabId {
  if (pathname.startsWith('/app/circles')) return 'circles'
  if (pathname.startsWith('/app/sarathy')) return 'sarathy'
  if (
    pathname.startsWith('/app/story') ||
    pathname.startsWith('/app/future') ||
    pathname.startsWith('/app/biases') ||
    pathname.startsWith('/app/insights') ||
    pathname.startsWith('/app/mydata')
  ) {
    return 'story'
  }
  if (
    pathname.startsWith('/app/profile') ||
    pathname.startsWith('/app/pricing') ||
    pathname.startsWith('/app/marketplace') ||
    pathname.startsWith('/app/fixed')
  ) {
    return 'profile'
  }

  return 'home'
}

export default function TabBar({ active }: Props) {
  const pathname = usePathname()
  const activeTab = active || getActiveTab(pathname)

  return (
    <nav className="tab-bar" aria-label="Primary navigation">
      <Link href="/app/home" className="tab-brand" aria-label="Sarathy home">
        <BrandMark decorative className="h-12 w-12" />
      </Link>
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`tab-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
