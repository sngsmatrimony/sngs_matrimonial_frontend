'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FAMILY_STATUS,
  RESIDENTIAL_STATUS,
} from '@/lib/constants/formData';
import { getAllOccupationOptions } from '@/lib/constants/formData';

export function FamilyDetailsStep({ form }) {
  const occupationOptions = getAllOccupationOptions();

  return (
    <div className="space-y-6">
      {/* <h2 className="font-serif text-xl text-[#1A1A1A]">Family & Additional Details</h2> */}

      {/* Father Details */}
      <div className="space-y-4 p-5 border border-[#D4A843]/20 rounded-xl bg-[#FDF8F0]/60">
        <h3 className="font-sans font-semibold text-[#1A1A1A]">Father&apos;s Information</h3>

        <FormField
          control={form.control}
          name="fatherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Father&apos;s Name *</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder="Enter father's name" className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50" />
              </FormControl>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fatherOccupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Father&apos;s Occupation *</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {occupationOptions.map((option, idx) => (
                    <SelectItem key={`${option}-${idx}`} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />
      </div>

      {/* Mother Details */}
      <div className="space-y-4 p-5 border border-[#D4A843]/20 rounded-xl bg-[#FDF8F0]/60">
        <h3 className="font-sans font-semibold text-[#1A1A1A]">Mother&apos;s Information</h3>

        <FormField
          control={form.control}
          name="motherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Mother&apos;s Name *</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder="Enter mother's name" className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50" />
              </FormControl>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motherOccupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Mother&apos;s Occupation *</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {occupationOptions.map((option, idx) => (
                    <SelectItem key={`${option}-${idx}`} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />
      </div>

      {/* Residential Status - Pill Buttons */}
      <FormField
        control={form.control}
        name="residentialStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Residential Status *</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {RESIDENTIAL_STATUS.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => field.onChange(field.value === status ? '' : status)}
                    className={`px-4 py-2 rounded-full font-sans font-semibold transition-all ${
                      field.value === status
                        ? 'bg-[#D4A843] text-[#1A1A1A] border-2 border-[#D4A843] shadow-sm'
                        : 'bg-white text-[#2C3E50] border-2 border-[#D4A843]/30 hover:border-[#D4A843] hover:bg-[#F5E6C3]/40'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      {/* Family Status - Pill Buttons */}
      <FormField
        control={form.control}
        name="familyStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Family Status *</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {FAMILY_STATUS.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => field.onChange(status)}
                    className={`px-4 py-2 rounded-full font-sans text-sm font-medium transition-all duration-150 ${
                      field.value === status
                        ? 'bg-[#D4A843] text-[#1A1A1A] border-2 border-[#D4A843] shadow-sm'
                        : 'bg-white text-[#2C3E50] border-2 border-[#D4A843]/30 hover:border-[#D4A843] hover:bg-[#F5E6C3]/40'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

    </div>
  );
}