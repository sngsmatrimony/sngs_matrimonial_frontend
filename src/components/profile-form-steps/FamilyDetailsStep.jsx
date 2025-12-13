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
      <h2 className="font-viga text-xl text-secondary">Family & Additional Details</h2>

      {/* SNGS Membership Number */}
      <FormField
        control={form.control}
        name="sngsMembershipNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">SNGS Membership Number (Optional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                type="text"
                placeholder="Enter SNGS membership number"
                className="font-maven"
                maxLength={50}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Father Details */}
      <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-maven font-semibold text-secondary">Father&apos;s Information</h3>

        <FormField
          control={form.control}
          name="fatherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Father&apos;s Name (Optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder="Enter father's name" className="font-maven" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fatherOccupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Father&apos;s Occupation (Optional)</FormLabel>
              <Select value={field.value || ''} onValueChange={(val) => field.onChange(val || undefined)}>
                <FormControl>
                  <SelectTrigger className="font-maven">
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Mother Details */}
      <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-maven font-semibold text-secondary">Mother&apos;s Information</h3>

        <FormField
          control={form.control}
          name="motherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Mother&apos;s Name (Optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder="Enter mother's name" className="font-maven" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motherOccupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">Mother&apos;s Occupation (Optional)</FormLabel>
              <Select value={field.value || ''} onValueChange={(val) => field.onChange(val || undefined)}>
                <FormControl>
                  <SelectTrigger className="font-maven">
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
              <FormMessage />
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
            <FormLabel className="font-maven">Residential Status (Optional)</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {RESIDENTIAL_STATUS.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => field.onChange(field.value === status ? '' : status)}
                    className={`px-4 py-2 rounded-full font-telex font-semibold transition-all ${
                      field.value === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-secondary border-2 border-gray-200 hover:border-primary'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Family Status - Pill Buttons */}
      <FormField
        control={form.control}
        name="familyStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Family Status</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {FAMILY_STATUS.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => field.onChange(status)}
                    className={`px-4 py-2 rounded-full font-telex font-semibold transition-all ${
                      field.value === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-secondary border-2 border-gray-200 hover:border-primary'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* About Myself */}
      <FormField
        control={form.control}
        name="about"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">About Myself</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Tell us about yourself (minimum 50 characters)"
                className="font-maven min-h-32"
                maxLength={1000}
              />
            </FormControl>
            <div className="text-sm mt-2 text-muted-foreground">
              {field.value?.length || 0}/1000 characters (minimum 50 required)
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
