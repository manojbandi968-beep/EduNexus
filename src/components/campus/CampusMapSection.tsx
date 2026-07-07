'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAP_CENTER = { lat: 17.5460325, lng: 78.3967739 };
const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=17.5460325,78.3967739';
const EMBED_SRC = `https://maps.google.com/maps?q=${MAP_CENTER.lat},${MAP_CENTER.lng}&z=15&output=embed`;

export function CampusMapSection() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass-card border-0 overflow-hidden">
        <div className="relative">
          <div className="aspect-[21/9] sm:aspect-[3/1] w-full bg-muted">
            <iframe
              src={EMBED_SRC}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '250px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="College Campus Map"
              className="w-full h-full"
            />
          </div>

          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-xl bg-background/90 backdrop-blur-sm px-3 py-2 shadow-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Sri Chaitanya Boys Junior College</span>
          </div>

          <div className="absolute bottom-3 right-3 flex gap-2">
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'rounded-xl gap-2 shadow-lg backdrop-blur-sm'
              )}
            >
              <Navigation className="h-4 w-4" />
              Get Directions
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
