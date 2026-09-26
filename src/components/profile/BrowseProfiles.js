'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';
import {
  COUNTRIES,
  INDIAN_STATES,
  HINDU_CASTES,
  MARITAL_STATUS,
  MOTHER_TONGUES,
  getAllEducationOptions,
} from '@/lib/constants/formData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileCard from './ProfileCard';

const EDUCATION_OPTIONS = getAllEducationOptions();

function FilterControls({
  country, setCountry,
  state, setState,
  education, setEducation,
  caste, setCaste,
  maritalStatus, setMaritalStatus,
  motherTongue, setMotherTongue,
  sortBy, setSortBy,
  ignoreAge, setIgnoreAge,
  onReset,
}) {
  const hasActiveFilters = country || state || education || caste || maritalStatus || motherTongue || sortBy !== 'newest' || ignoreAge;

  return (
    <div className="space-y-5">
      <div>
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Location</label>
        <Select value={country || 'all'} onValueChange={(v) => { setCountry(v === 'all' ? '' : v); if (v !== 'India') setState(''); }}>
          <SelectTrigger className="font-sans h-11 rounded-lg border-[#D4A843]/25">
            <SelectValue placeholder="Any location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any location</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {country === 'India' && (
        <div>
          <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">State</label>
          <Select value={state || 'all'} onValueChange={(v) => setState(v === 'all' ? '' : v)}>
            <SelectTrigger className="font-sans h-11 rounded-lg border-[#D4A843]/25">
              <SelectValue placeholder="Any state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any state</SelectItem>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Education</label>
        <Select value={education || 'all'} onValueChange={(v) => setEducation(v === 'all' ? '' : v)}>
          <SelectTrigger className="font-sans h-11 rounded-lg border-[#D4A843]/25">
            <SelectValue placeholder="Any education" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any education</SelectItem>
            {EDUCATION_OPTIONS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Caste</label>
        <Select value={caste || 'all'} onValueChange={(v) => setCaste(v === 'all' ? '' : v)}>
          <SelectTrigger className="font-sans h-11 rounded-lg border-[#D4A843]/25">
            <SelectValue placeholder="Any caste" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any caste</SelectItem>
            {HINDU_CASTES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Marital Status</label>
        <Select value={maritalStatus || 'all'} onValueChange={(v) => setMaritalStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="font-sans h-11 rounded-lg border-[#D4A843]/25">
            <SelectValue placeholder="Any marital status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any marital status</SelectItem>
            {MARITAL_STATUS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Mother Tongue</label>
        <Select value={motherTongue || 'all'} onValueChange={(v) => setMotherTongue(v === 'all' ? '' : v)}>
          <SelectTrigger className="font-sans h-11 rounded-lg border-[#D4A843]/25">
            <SelectValue placeholder="Any mother tongue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any mother tongue</SelectItem>
            <SelectGroup>
              <SelectLabel className="font-sans font-semibold">Frequently Selected</SelectLabel>
              {MOTHER_TONGUES.frequentlySelected.map((tongue) => (
                <SelectItem key={tongue} value={tongue}>{tongue}</SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="font-sans font-semibold">More Options</SelectLabel>
              {MOTHER_TONGUES.moreOptions.map((tongue) => (
                <SelectItem key={tongue} value={tongue}>{tongue}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-2">Sort By</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="font-sans h-11 rounded-lg border-[#D4A843]/25">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest Profiles</SelectItem>
            <SelectItem value="age">Youngest First</SelectItem>
            <SelectItem value="matchScore">Best Match</SelectItem>
            <SelectItem value="lastActive">Last Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-1 border-t border-[#D4A843]/15">
        <label className="flex items-start gap-2.5 pt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreAge}
            onChange={(e) => setIgnoreAge(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#D4A843]/40 accent-[#D4A843]"
          />
          <span className="font-sans text-sm text-[#1A1A1A]">
            Show profiles outside my preferred age range
          </span>
        </label>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="font-sans text-sm text-[#C75B39] hover:underline"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

export default function BrowseProfiles() {
  const router = useRouter();
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [education, setEducation] = useState('');
  const [caste, setCaste] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [motherTongue, setMotherTongue] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [ignoreAge, setIgnoreAge] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['browseProfiles', country, state, education, caste, maritalStatus, motherTongue, sortBy, ignoreAge],
    queryFn: async () => {
      const [profilesRes, likedRes, shortlistedRes] = await Promise.all([
        client.get('/api/profiles/discover', {
          params: {
            country, state, education, caste, maritalStatus, motherTongue, sortBy,
            ignoreAgePreference: ignoreAge ? 'true' : 'false',
          },
        }),
        client.get('/api/profiles/liked'),
        client.get('/api/profiles/shortlisted'),
      ]);

      const profiles = profilesRes.data.data || [];
      const likedIds = likedRes.data.data?.map((p) => p._id) || [];
      const shortlistedIds = shortlistedRes.data.data?.map((p) => p._id) || [];
      const gated = profilesRes.data.gated || false;
      const totalAvailable = profilesRes.data.totalAvailable || 0;

      return { profiles, likedIds, shortlistedIds, gated, totalAvailable };
    },
  });

  useEffect(() => {
    if (!error) return;
    console.error('Error fetching profiles:', error);
    if (error.response?.data?.requiresMembership || error.response?.data?.requiresCredits) {
      toastError(error.response.data.message);
      router.push('/membership/purchase');
    } else {
      toastError('Failed to load profiles');
    }
  }, [error, router]);

  const profilesData = data?.profiles || [];
  const isGated = data?.gated || false;
  const totalAvailable = data?.totalAvailable || 0;

  const likedIdsSet = useMemo(() => new Set(data?.likedIds || []), [data?.likedIds]);
  const shortlistedIdsSet = useMemo(() => new Set(data?.shortlistedIds || []), [data?.shortlistedIds]);

  const resetFilters = () => {
    setCountry('');
    setState('');
    setEducation('');
    setCaste('');
    setMaritalStatus('');
    setMotherTongue('');
    setSortBy('newest');
    setIgnoreAge(false);
  };

  const activeFilterCount = [country, state, education, caste, maritalStatus, motherTongue, ignoreAge].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FDF8F0] py-6 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Browse Profiles
          </h2>

          {/* Mobile filter trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden border-[#D4A843]/40 text-[#1A1A1A] font-sans gap-2">
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-[#D4A843] text-[#1A1A1A] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Filter Profiles</SheetTitle>
              </SheetHeader>
              <div className="p-4 overflow-y-auto">
                <FilterControls
                  country={country} setCountry={setCountry}
                  state={state} setState={setState}
                  education={education} setEducation={setEducation}
                  caste={caste} setCaste={setCaste}
                  maritalStatus={maritalStatus} setMaritalStatus={setMaritalStatus}
                  motherTongue={motherTongue} setMotherTongue={setMotherTongue}
                  sortBy={sortBy} setSortBy={setSortBy}
                  ignoreAge={ignoreAge} setIgnoreAge={setIgnoreAge}
                  onReset={resetFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-white border border-[#D4A843]/15 rounded-xl p-5 sticky top-[129px] max-h-[calc(100vh-137px)] overflow-y-auto">
              <h3 className="font-serif text-base font-semibold text-[#1A1A1A] mb-4">Filters</h3>
              <FilterControls
                country={country} setCountry={setCountry}
                state={state} setState={setState}
                education={education} setEducation={setEducation}
                caste={caste} setCaste={setCaste}
                maritalStatus={maritalStatus} setMaritalStatus={setMaritalStatus}
                motherTongue={motherTongue} setMotherTongue={setMotherTongue}
                sortBy={sortBy} setSortBy={setSortBy}
                ignoreAge={ignoreAge} setIgnoreAge={setIgnoreAge}
                onReset={resetFilters}
              />
            </div>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#D4A843]/15 shadow-sm overflow-hidden">
                    <Skeleton className="aspect-[4/5] rounded-none" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 w-9" />
                        <Skeleton className="h-8 w-9" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center max-w-sm">
                  <p className="font-sans text-lg text-[#1A1A1A] font-medium mb-2">
                    We couldn&apos;t load matches right now
                  </p>
                  <p className="font-sans text-sm text-[#2C3E50]/70">
                    Please check your connection and try refreshing the page.
                  </p>
                </div>
              </div>
            ) : profilesData.length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center max-w-sm">
                  <p className="font-sans text-lg text-[#1A1A1A] font-medium mb-2">
                    No profiles found matching your preferences
                  </p>
                  <p className="font-sans text-sm text-[#2C3E50]/70">
                    Try adjusting your filters, or check back soon as new members join.
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="mt-4 text-[#D4A843] hover:text-[#B8860B] font-sans font-medium text-sm underline"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {profilesData.map((profile) => (
                    <ProfileCard
                      key={profile._id}
                      profile={profile}
                      isLiked={likedIdsSet.has(profile._id)}
                      isShortlisted={shortlistedIdsSet.has(profile._id)}
                    />
                  ))}
                </div>

                {isGated && totalAvailable > profilesData.length && (
                  <div className="mt-8 rounded-xl border border-[#D4A843]/30 bg-[#F5E6C3]/40 p-6 text-center">
                    <p className="font-serif text-lg font-semibold text-[#1A1A1A] mb-1">
                      {totalAvailable - profilesData.length} more {totalAvailable - profilesData.length === 1 ? 'match' : 'matches'} waiting for you
                    </p>
                    <p className="font-sans text-sm text-[#2C3E50] mb-4">
                      Upgrade your membership to see your full list of matches.
                    </p>
                    <button
                      onClick={() => router.push('/membership/purchase')}
                      className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold px-6 py-2.5 rounded-lg transition-colors"
                    >
                      Upgrade Membership
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
