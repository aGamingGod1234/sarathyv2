'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, MessageCircle, UserRound, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type TabId = 'home' | 'sarathy' | 'circles' | 'story' | 'profile'

interface Props {
  active?: TabId
}

const tabs: Array<{ id: TabId; href: string; label: string; icon: LucideIcon }> = [
  { id: 'home', href: '/home', label: 'Today', icon: Home },
  { id: 'circles', href: '/circles', label: 'Circles', icon: UsersRound },
  { id: 'sarathy', href: '/sarathy', label: 'Sarathy', icon: MessageCircle },
  { id: 'story', href: '/story', label: 'Story', icon: BookOpen },
  { id: 'profile', href: '/profile', label: 'Profile', icon: UserRound },
]

function getActiveTab(pathname: string): TabId {
  if (pathname.startsWith('/circles')) return 'circles'
  if (pathname.startsWith('/sarathy')) return 'sarathy'
  if (
    pathname.startsWith('/story') ||
    pathname.startsWith('/future') ||
    pathname.startsWith('/biases') ||
    pathname.startsWith('/insights') ||
    pathname.startsWith('/mydata')
  ) {
    return 'story'
  }
  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/marketplace') ||
    pathname.startsWith('/fixed')
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
      <Link href="/home" className="tab-brand" aria-label="Sarathy home">
        S
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
