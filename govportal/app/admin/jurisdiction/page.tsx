"use client"

import { useEffect, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { REQUEST } from "@/services/api"
import FormField from "@/components/reusables/FormField"
import { 
  MultiSelect, 
  MultiSelectContent, 
  MultiSelectItem, 
  MultiSelectTrigger, 
  MultiSelectValue 
} from "@/components/ui/multi-select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronsUpDown,Landmark,EarthLock,Building2 } from "lucide-react"

export default function AdminSetupCarousel() {
  const [jurisdictions, setJurisdictions] = useState<any[]>([])
  const [domains, setDomains] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  const [newJurisdiction, setNewJurisdiction] = useState({ name: "", code: "", location: "" })
  const [newDomain, setNewDomain] = useState({ name: "", description: "" })
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    code: "",
    contact_point: "",
    jurisdiction: "",
    domains: []
  })

  const [jurisdictionOpen, setJurisdictionOpen] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [jurisRes, domainsRes, deptRes] = await Promise.all([
        REQUEST("GET", "admins/jurisdictions/") || [],
        REQUEST("GET", "admins/domains/") || [],
        REQUEST("GET", "admins/departments/") || []
      ])
      setJurisdictions(jurisRes)
      setDomains(domainsRes)
      setDepartments(deptRes)
    } catch (error) {
      toast.error("Failed to fetch data")
    }
  }

  const createJurisdiction = async () => {
    if (!newJurisdiction.name || !newJurisdiction.code) {
      return toast.error("Name and Code are required")
    }
    
    const res = await REQUEST("POST", "admins/jurisdictions/", newJurisdiction)
    if (!res.ok) return toast.error("Jurisdiction exists")
    setJurisdictions(prev => [...prev, res])
    setNewJurisdiction({ name: "", code: "", location: "" })
    toast.success("Jurisdiction created")
  }

  const createDomain = async () => {
    if (!newDomain.name) {
      return toast.error("Name is required")
    }
    
    const res = await REQUEST("POST", "admins/domains/", newDomain)
    if (!res.ok) return toast.error("Domain exists")
    setDomains(prev => [...prev, res])
    setNewDomain({ name: "", description: "" })
    toast.success("Domain created")
  }

  const createDepartment = async () => {
    if (!newDepartment.name || !newDepartment.code || !newDepartment.jurisdiction) {
      return toast.error("Name, Code, and Jurisdiction are required")
    }
    
    const res = await REQUEST("POST", "admins/departments/", newDepartment)
    if (!res.ok) return toast.error("Failed to create department")
    setDepartments(prev => [...prev, res])
    setNewDepartment({ name: "", code: "", contact_point: "", jurisdiction: "", domains: [] })
    toast.success("Department created")
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Administrative Setup</h1>
        <p className="text-muted-foreground mt-2">Manage jurisdictions, domains, and departments</p>
      </div>

      <Carousel className="w-full">
        <CarouselContent>
          {/* Slide 1: Jurisdictions */}
          <CarouselItem>
            <Card className="border rounded-xl">
              <CardHeader className="pb-6 border-b">
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <Landmark/>
                  Jurisdictions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left Column - Existing Items */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Existing Jurisdictions ({jurisdictions.length})
                    </h3>
                    <ScrollArea className="h-100 rounded-lg border bg-card">
                      <div className="p-6">
                        {jurisdictions.map((j) => (
                          <div key={j.id} className="flex items-center gap-4 p-3 hover:bg-blue-200/50 rounded-lg transition-colors group">
                            <div className="flex-1 min-w-1">
                              <p className="font-medium truncate">{j.name}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="bg-muted px-2 py-0.5 rounded text-xs">{j.code}</span>
                              </div>
                                <span className="">{j.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right Column - Create Form */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Create New Jurisdiction
                    </h3>
                    <div className="space-y-6">
                      <FormField label="Name *" value={newJurisdiction.name} placeholder="Enter jurisdiction name" onChange={value => setNewJurisdiction({ ...newJurisdiction, name: value })} />
                      <FormField label="Code *" value={newJurisdiction.code} placeholder="Enter unique code" onChange={value => setNewJurisdiction({ ...newJurisdiction, code: value })}/>
 
                      <FormField label="Location" value={newJurisdiction.location} placeholder="Enter location" onChange={value => setNewJurisdiction({ ...newJurisdiction, location: value })}/>
 
                      <Button 
                        onClick={createJurisdiction}
                        className="w-full h-11 text-base font-medium"
                        disabled={!newJurisdiction.name || !newJurisdiction.code}
                      >
                        Create Jurisdiction
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 2: Domains */}
          <CarouselItem>
            <Card className="border rounded-xl bg-linear-to-br from-background to-muted/5">
              <CardHeader className="pb-6 border-b">
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <EarthLock/>
                  Domains
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left Column - Existing Items */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Existing Domains ({domains.length})
                    </h3>
                    <ScrollArea className="h-100 rounded-lg border bg-card">
                      <div className="p-6">
                        {domains.map((d) => (
                          <div key={d.id} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors group">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{d.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {d.description || "No description"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right Column - Create Form */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Create New Domain
                    </h3>
                    <div className="space-y-6">
                      <FormField
                        label="Domain Name *"
                        value={newDomain.name}
                        placeholder="Enter domain name"
                        onChange={value => setNewDomain({ ...newDomain, name: value })}
                      />
                      <FormField
                        label="Description"
                        value={newDomain.description}
                        placeholder="Enter description"
                        onChange={value => setNewDomain({ ...newDomain, description: value })}
                      />
                      <Button 
                        onClick={createDomain}
                        className="w-full h-11 text-base font-medium"
                        disabled={!newDomain.name}
                      >
                        Create Domain
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 3: Departments */}
          <CarouselItem>
            <Card className="border shadow-xl rounded-xl bg-linear-to-br from-background to-muted/5">
              <CardHeader className="pb-6 border-b">
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <Building2/>
                  Departments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left Column - Existing Items */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Existing Departments ({departments.length})
                    </h3>
                    <ScrollArea className="h-100 rounded-lg border bg-card">
                      <div className="p-6">
                        {departments.map((dep) => (
                          <div key={dep.id} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors group">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{dep.name}</p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span className="bg-muted px-2 py-0.5 rounded text-xs">{dep.code}</span>
                                <span className="truncate">Contact: {dep.contact_point}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right Column - Create Form */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Create New Department
                    </h3>
                    <div className="space-y-6">
                      <FormField
                        label="Department Name *"
                        value={newDepartment.name}
                        placeholder="Enter department name"
                        onChange={value => setNewDepartment({ ...newDepartment, name: value })}
                      />
                      <FormField
                        label="Code *"
                        value={newDepartment.code}
                        placeholder="Enter department code"
                        onChange={value => setNewDepartment({ ...newDepartment, code: value })}
                      />
                      <FormField
                        label="Contact Person"
                        value={newDepartment.contact_point}
                        placeholder="Enter contact person"
                        onChange={value => setNewDepartment({ ...newDepartment, contact_point: value })}
                      />
                      
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Jurisdiction *</label>
                        <Popover open={jurisdictionOpen} onOpenChange={setJurisdictionOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={jurisdictionOpen}
                              className="w-full justify-between h-11"
                            >
                              {newDepartment.jurisdiction
                                ? jurisdictions.find(j => j.id === newDepartment.jurisdiction)?.name
                                : "Select jurisdiction..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search jurisdiction..." />
                              <CommandList>
                                <CommandEmpty>No jurisdiction found.</CommandEmpty>
                                <CommandGroup>
                                  {jurisdictions.map((j) => (
                                    <CommandItem
                                      key={j.id}
                                      value={j.id}
                                      onSelect={() => {
                                        setNewDepartment({ ...newDepartment, jurisdiction: j.id })
                                        setJurisdictionOpen(false)
                                      }}
                                    >
                                      {j.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium">Domains</label>
                        <MultiSelect
                          values={newDepartment.domains}
                          onValuesChange={(values) => setNewDepartment({ ...newDepartment, domains: values })}
                        >
                          <MultiSelectTrigger className="h-11">
                            <MultiSelectValue placeholder="Select domains..." />
                          </MultiSelectTrigger>
                          <MultiSelectContent>
                            {domains.map(d => (
                              <MultiSelectItem key={d.id} value={d.id} badgeLabel={d.name}>
                                {d.name}
                              </MultiSelectItem>
                            ))}
                          </MultiSelectContent>
                        </MultiSelect>
                      </div>

                      <Button 
                        onClick={createDepartment}
                        className="w-full h-11 text-base font-medium"
                        disabled={!newDepartment.name || !newDepartment.code || !newDepartment.jurisdiction}
                      >
                        Create Department
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>

        </CarouselContent>

        <CarouselPrevious className="ml-4" />
        <CarouselNext className="mr-4" />
      </Carousel>
    </div>
  )
}