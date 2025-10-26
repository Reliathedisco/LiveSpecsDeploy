"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Globe } from "lucide-react"
import toast from "react-hot-toast"

interface BrandingSettingsProps {
  teamId: string
}

export function BrandingSettings({ teamId }: BrandingSettingsProps) {
  const [logoUrl, setLogoUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#000000")
  const [secondaryColor, setSecondaryColor] = useState("#ffffff")
  const [customCss, setCustomCss] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [supportEmail, setSupportEmail] = useState("")
  const [hideBranding, setHideBranding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [domain, setDomain] = useState("")
  const [domains, setDomains] = useState<any[]>([])
  const [verificationToken, setVerificationToken] = useState("")

  useEffect(() => {
    fetchBranding()
    fetchDomains()
  }, [teamId])

  async function fetchBranding() {
    try {
      const response = await fetch(`/api/branding?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setLogoUrl(data.logo_url || "")
          setFaviconUrl(data.favicon_url || "")
          setPrimaryColor(data.primary_color || "#000000")
          setSecondaryColor(data.secondary_color || "#ffffff")
          setCustomCss(data.custom_css || "")
          setCompanyName(data.company_name || "")
          setSupportEmail(data.support_email || "")
          setHideBranding(data.hide_livespecs_branding || false)
        }
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error)
    }
  }

  async function fetchDomains() {
    try {
      const response = await fetch(`/api/domains?teamId=${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setDomains(data)
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error)
    }
  }

  async function saveBranding() {
    setSaving(true)
    try {
      const response = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          logoUrl,
          faviconUrl,
          primaryColor,
          secondaryColor,
          customCss,
          companyName,
          supportEmail,
          hideLivespecsBranding: hideBranding,
        }),
      })

      if (response.ok) {
        toast.success("Branding updated!")
      } else {
        toast.error("Failed to update branding")
      }
    } catch (error) {
      console.error("Failed to save branding:", error)
      toast.error("Failed to update branding")
    } finally {
      setSaving(false)
    }
  }

  async function addDomain() {
    if (!domain) {
      toast.error("Please enter a domain")
      return
    }

    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, domain }),
      })

      if (response.ok) {
        const data = await response.json()
        setVerificationToken(data.verification_token)
        toast.success("Domain added! Please verify DNS records.")
        fetchDomains()
        setDomain("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add domain")
      }
    } catch (error) {
      console.error("Failed to add domain:", error)
      toast.error("Failed to add domain")
    }
  }

  async function verifyDomain(domainId: string) {
    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.verified) {
          toast.success("Domain verified!")
          fetchDomains()
        } else {
          toast.error(data.error || "Verification failed")
        }
      } else {
        toast.error("Verification failed")
      }
    } catch (error) {
      console.error("Verification failed:", error)
      toast.error("Verification failed")
    }
  }

  return (
    <Tabs defaultValue="appearance" className="w-full">
      <TabsList>
        <TabsTrigger value="appearance">
          <Palette className="h-4 w-4 mr-2" />
          Appearance
        </TabsTrigger>
        <TabsTrigger value="domains">
          <Globe className="h-4 w-4 mr-2" />
          Custom Domains
        </TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="favicon">Favicon URL</Label>
              <Input
                id="favicon"
                placeholder="https://example.com/favicon.ico"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="primary"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary">Secondary Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="secondary"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Acme Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="support">Support Email</Label>
              <Input
                id="support"
                type="email"
                placeholder="support@example.com"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="css">Custom CSS</Label>
            <Textarea
              id="css"
              placeholder=".custom-class { color: red; }"
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              className="mt-2 min-h-[120px] font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="hide" checked={hideBranding} onCheckedChange={(checked) => setHideBranding(!!checked)} />
            <Label htmlFor="hide" className="text-sm font-normal cursor-pointer">
              Hide LiveSpecs branding (Enterprise only)
            </Label>
          </div>

          <Button onClick={saveBranding} disabled={saving}>
            {saving ? "Saving..." : "Save Branding"}
          </Button>
        </Card>
      </TabsContent>

      <TabsContent value="domains" className="space-y-6">
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="domain">Add Custom Domain</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="domain"
                placeholder="docs.example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <Button onClick={addDomain}>Add Domain</Button>
            </div>
          </div>

          {verificationToken && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Add this TXT record to your DNS:</p>
              <div className="space-y-1 text-sm font-mono">
                <div>
                  <span className="text-muted-foreground">Name:</span> _livespecs-verification.{domain}
                </div>
                <div>
                  <span className="text-muted-foreground">Value:</span> {verificationToken}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {domains.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{d.domain}</div>
                  <div className="text-sm text-muted-foreground">
                    {d.verified ? "Verified" : "Pending verification"}
                  </div>
                </div>
                {!d.verified && (
                  <Button variant="outline" size="sm" onClick={() => verifyDomain(d.id)}>
                    Verify
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
