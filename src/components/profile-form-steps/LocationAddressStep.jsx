'use client';

import { useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { COUNTRIES, INDIAN_STATES } from '@/lib/constants/formData';

function AddressFieldset({ form, prefix, title, isOptional = false }) {
  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <h3 className="font-maven font-semibold text-secondary">{title}{isOptional ? ' (Optional)' : ''}</h3>

      <FormField
        control={form.control}
        name={`${prefix}.street`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Street Address</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter street address" className="font-maven" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.area`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Area / Locality</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter area or locality" className="font-maven" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.landmark`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Landmark</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter nearby landmark" className="font-maven" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.pincode`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Pincode</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter pincode" className="font-maven" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.city`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">City</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter city" className="font-maven" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.state`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">State</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter state" className="font-maven" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function LocationAddressStep({ form }) {
  const watchCountry = useWatch({ control: form.control, name: 'country' });

  const getStates = () => {
    if (watchCountry === 'India') {
      return INDIAN_STATES;
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <h2 className="font-viga text-xl text-secondary">Location & Addresses</h2>

      {/* Country */}
      <FormField
        control={form.control}
        name="country"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">Country</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="font-maven">
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
            <FormMessage />
          </FormItem>
        )}
      />

      {/* State - Only for India */}
      {watchCountry === 'India' && (
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-maven">State</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="font-maven">
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
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* City */}
      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-maven">City (Optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter city" className="font-maven" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Present Residential Address */}
      <AddressFieldset
        form={form}
        prefix="presentResidentialAddress"
        title="Present Residential Address"
        isOptional={true}
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
