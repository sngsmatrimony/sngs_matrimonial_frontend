'use client';

import { CircleHelp, Mail, Phone } from 'lucide-react';
import { useContactInfo } from '@/hooks/useContactInfo';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function HelpButton() {
  const { data: contactInfo } = useContactInfo();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Help"
          className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-[#F5E6C3]/40 transition-colors mx-2 lg:mx-6"
        >
          <CircleHelp size={24} className="text-[#2C3E50]" />
          <span className="hidden sm:inline font-sans text-sm text-[#2C3E50]">Help</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm" align="end">
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-semibold text-[#1A1A1A] mb-3">Contact Us</h3>

            {/* Email */}
            <a
              href={`mailto:${contactInfo?.contactEmail}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F5E6C3]/40 transition-colors"
            >
              <Mail size={18} className="text-[#D4A843] shrink-0" />
              <span className="font-sans text-sm text-[#2C3E50] whitespace-nowrap">
                {contactInfo?.contactEmail}
              </span>
            </a>

            {/* Mobile */}
            <a
              href={`tel:+91${contactInfo?.contactMobile}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F5E6C3]/40 transition-colors"
            >
              <Phone size={18} className="text-[#D4A843] shrink-0" />
              <span className="font-sans text-sm text-[#2C3E50]">
                +91 {contactInfo?.contactMobile}
              </span>
            </a>
          </div>
        </PopoverContent>
      </Popover>
  );
}
