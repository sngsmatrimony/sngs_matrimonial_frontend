'use client';

import { useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  EMPLOYMENT_TYPES,
  ANNUAL_INCOME_INR,
  CURRENCIES,
  getAllEducationOptions,
  getAllOccupationOptions,
} from '@/lib/constants/formData';

export function ProfessionalDetailsStep({ form }) {
  const watchCurrency = useWatch({ control: form.control, name: 'annualIncomeCurrency' });
  const educationOptions = getAllEducationOptions();
  const occupationOptions = getAllOccupationOptions();

  return (
    <div className="space-y-6">
      {/* <h2 className="font-serif text-xl text-[#1A1A1A]">Professional Details</h2> */}

      {/* Education */}
      <FormField
        control={form.control}
        name="education"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Education *</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {educationOptions.map((option, idx) => (
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

      {/* Employment Type */}
      <FormField
        control={form.control}
        name="employmentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Employment Type *</FormLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EMPLOYMENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />

      {/* Occupation */}
      <FormField
        control={form.control}
        name="occupation"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Occupation *</FormLabel>
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

      {/* Annual Income */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="annualIncomeCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Income Currency *</FormLabel>
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCIES.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="annualIncomeAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Annual Income Amount *</FormLabel>
              {watchCurrency === 'INR' ? (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="font-sans h-12 rounded-xl border-[#D4A843]/25 text-[#1A1A1A] focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50">
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ANNUAL_INCOME_INR.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Enter annual income"
                    className="font-sans h-12 rounded-xl border-[#D4A843]/25 focus-visible:ring-[#D4A843]/40 focus-visible:border-[#D4A843]/50"
                  />
                </FormControl>
              )}
              <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
            </FormItem>
          )}
        />
      </div>

      {/* Professional Additional Information */}
      <FormField
        control={form.control}
        name="professionalAdditionalInfo"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-sans text-sm font-medium text-[#1A1A1A]">Additional Information *</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Any additional professional details..."
                maxLength={500}
                rows={4}
                className="font-sans-pro resize-none"
              />
            </FormControl>
            <FormDescription className="font-sans">
              Optional field
            </FormDescription>
            <div className="text-sm text-gray-500 font-sans">
              {field.value?.length || 0}/500
            </div>
            <FormMessage className="font-sans text-xs font-normal text-[#C75B39] mt-1" />
          </FormItem>
        )}
      />
    </div>
  );
}