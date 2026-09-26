'use client';

import { useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { COUNTRIES, INDIAN_STATES } from '@/lib/constants/formData';

function AddressFieldset({ form, prefix, title, isOptional = false }) {
  const watchCountry = useWatch({ control: form.control, name: `${prefix}.country` });

  return (
    <div className="space-y-4 p-5 border border-[#D4A843]/20 rounded-xl bg-[#FDF8F0]/60">
      <h3 className="font-sans font-semibold text-[#1A1A1A]">{title}{isOptional ? ' (Optional)' : ''}</h3>

      <FormField
        control={form.control}
        name={`${prefix}.country`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Country{isOptional ? ' (Optional)' : ' *'}</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      {watchCountry === 'India' && (
        <FormField
          control={form.control}
          name={`${prefix}.state`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">State{isOptional ? ' (Optional)' : ' *'}</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INDIAN_STATES.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name={`${prefix}.city`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">City{isOptional ? ' (Optional)' : ' *'}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter city" className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50" />
            </FormControl>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.street`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Street Address{isOptional ? ' (Optional)' : ' *'}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter street address" className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50" />
            </FormControl>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.area`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Area / Locality{isOptional ? ' (Optional)' : ' *'}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter area or locality" className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50" />
            </FormControl>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.landmark`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Landmark{isOptional ? ' (Optional)' : ' *'}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter nearby landmark" className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50" />
            </FormControl>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.pincode`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Pincode{isOptional ? ' (Optional)' : ' *'}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter pincode" className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50" />
            </FormControl>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />
    </div>
  );
}

export function LocationAddressStep({ form }) {
  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-1">Location & Addresses</h2>

      {/* Present Residential Address (Now Validated as Main Location) */}
      <AddressFieldset
        form={form}
        prefix="presentResidentialAddress"
        title="Present Residential Address"
        isOptional={false}
      />

      {/* Native Place Address */}
      <AddressFieldset
        form={form}
        prefix="nativePlaceAddress"
        title="Native Place Address"
        isOptional={true}
      />
    </div>
  );
}