import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { createCheckoutSession } from '@/lib/stripe'
import { formatPrice, type StripeProduct } from '@/stripe-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CircleCheck as CheckCircle, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react'

interface PricingCardProps {
  product: StripeProduct
}

export function PricingCard({ product }: PricingCardProps) {
  const { user } = useAuth()
  const { plan, isActive } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCurrentPlan = plan?.priceId === product.priceId && isActive

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    setError('')

    try {
      const checkoutUrl = await createCheckoutSession(product.priceId, product.mode)
      window.location.href = checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setLoading(false)
    }
  }

  return (
    <Card className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-xl">{product.name}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {product.description}
        </CardDescription>
        <div className="mt-4">
          <span className="text-3xl font-bold">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.mode === 'subscription' && (
            <span className="text-gray-600 ml-1">/month</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={handleSubscribe}
          disabled={loading || isCurrentPlan}
          className="w-full"
          variant={isCurrentPlan ? "secondary" : "default"}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCurrentPlan && <CheckCircle className="mr-2 h-4 w-4" />}
          {isCurrentPlan
            ? 'Current Plan'
            : loading
            ? 'Processing...'
            : product.mode === 'subscription'
            ? 'Subscribe'
            : 'Purchase'
          }
        </Button>
      </CardContent>
    </Card>
  )
}