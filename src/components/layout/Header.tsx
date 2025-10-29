import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, LogOut } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const { plan, isActive } = useSubscription()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900">
          LiveSpecs
        </Link>
        
        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              
              {plan && isActive && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {plan.name}
                </Badge>
              )}
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}