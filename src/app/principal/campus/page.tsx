'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Building2,
  Library,
  Utensils,
  Dumbbell,
  Trees,
  Bus,
  Car,
  Microscope,
  Monitor,
  Landmark,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampusMapSection } from '@/components/campus/CampusMapSection';

interface CampusFacility {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'academic' | 'amenity' | 'transport';
  building: string;
  floor?: string;
  hours: string;
}

const facilities: CampusFacility[] = [
  { id: '1', name: 'Main Academic Block', description: 'Primary building for classrooms, staff rooms, and departmental offices.', icon: <Building2 className="h-5 w-5" />, category: 'academic', building: 'Block A', hours: '7:00 AM – 8:00 PM' },
  { id: '2', name: 'Library', description: 'Central library with 40,000+ books, journals, and digital resources.', icon: <Library className="h-5 w-5" />, category: 'academic', building: 'Block B, 1st Floor', hours: '8:00 AM – 8:00 PM' },
  { id: '3', name: 'Science Laboratories', description: 'Physics, Chemistry, and Biology labs equipped with modern instruments.', icon: <Microscope className="h-5 w-5" />, category: 'academic', building: 'Block C', hours: '9:00 AM – 5:00 PM' },
  { id: '4', name: 'Computer Center', description: '3 computer labs with 150 systems, high-speed internet, and printing facilities.', icon: <Monitor className="h-5 w-5" />, category: 'academic', building: 'Block B, 2nd Floor', hours: '8:00 AM – 7:00 PM' },
  { id: '5', name: 'Auditorium', description: '1000-seat auditorium with state-of-the-art AV systems for events and seminars.', icon: <Landmark className="h-5 w-5" />, category: 'amenity', building: 'Block D', hours: 'As per booking' },
  { id: '6', name: 'Cafeteria', description: 'Multi-cuisine cafeteria with seating for 500. Also includes a juice bar.', icon: <Utensils className="h-5 w-5" />, category: 'amenity', building: 'Block E', hours: '7:30 AM – 7:00 PM' },
  { id: '7', name: 'Gym & Sports Complex', description: 'Indoor gymnasium, basketball court, table tennis, and badminton courts.', icon: <Dumbbell className="h-5 w-5" />, category: 'amenity', building: 'Sports Block', hours: '6:00 AM – 8:00 PM' },
  { id: '8', name: 'Gardens & Open Air Theatre', description: 'Landscaped gardens with seating and an open-air stage for cultural events.', icon: <Trees className="h-5 w-5" />, category: 'amenity', building: 'Central Campus', hours: 'Always open' },
  { id: '9', name: 'Bus Stop & Parking', description: 'College bus stop servicing 20+ routes. Parking available for staff and students.', icon: <Bus className="h-5 w-5" />, category: 'transport', building: 'Main Gate', hours: '6:00 AM – 9:00 PM' },
  { id: '10', name: 'Staff Parking', description: 'Reserved parking area for faculty and staff with 24/7 security.', icon: <Car className="h-5 w-5" />, category: 'transport', building: 'Side Entrance', hours: '24/7' },
];

export default function PrincipalCampus() {
  const [search, setSearch] = useState('');

  const filtered = facilities.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase()) ||
    f.building.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="principal" userName="Dr. Director" userEmail="director@college.edu">
      <div className="space-y-6 pb-20 lg:pb-8">
        <PageHeader title="Campus" description="Explore campus facilities and directions" />

        <CampusMapSection />

        <div className="relative max-w-sm">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search facilities..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl bg-background/50 pl-9" />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="all" className="rounded-lg text-xs h-8">All</TabsTrigger>
            <TabsTrigger value="academic" className="rounded-lg text-xs h-8">Academic</TabsTrigger>
            <TabsTrigger value="amenity" className="rounded-lg text-xs h-8">Amenities</TabsTrigger>
            <TabsTrigger value="transport" className="rounded-lg text-xs h-8">Transport</TabsTrigger>
          </TabsList>

          {['all', 'academic', 'amenity', 'transport'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(tab === 'all' ? filtered : filtered.filter(f => f.category === tab)).map((fac, i) => (
                  <motion.div
                    key={fac.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {fac.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{fac.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{fac.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{fac.building}</span>
                          <span className="flex items-center gap-1">{fac.hours}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {tab !== 'all' && filtered.filter(f => f.category === tab).length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <MapPin className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No facilities found in this category</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
