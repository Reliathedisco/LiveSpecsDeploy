import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CircleCheck as CheckCircle, ArrowRight, Loader as Loader2 } from 'lucide-react'

export function Success() {
  const { user } = useAuth()
  const { subscription, plan, loading } = useSubscription()
  const [isRefreshing, setIsRefreshing] = useState(true)

  useEffect(() => {
    // Give some time for the webhook to process and update the subscription
    const timer = setTimeout(() => {
      setIsRefreshing(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Please Sign In</CardTitle>
            <CardDescription className="text-center">
              You need to be signed in to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </CardTitle>
            <CardDescription className="text-center">
              We're setting up your subscription. This may take a few moments.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
          <CardDescription>
            Thank you for your purchase. Your payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {plan && subscription?.subscription_status === 'active' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Subscription Active</h3>
              <p className="text-sm text-green-700">
                Your <strong>{plan.name}</strong> subscription is now active and ready to use.
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Link to="/">
              <Button className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" className="w-full">
                View Pricing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}