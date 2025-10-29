import { stripeProducts } from '@/stripe-config'
import { PricingCard } from '@/components/pricing/PricingCard'

export function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with LiveSpecs and unlock powerful features for your API development workflow.
          </p>
        </div>
        
        <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stripeProducts.map((product) => (
            <PricingCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}