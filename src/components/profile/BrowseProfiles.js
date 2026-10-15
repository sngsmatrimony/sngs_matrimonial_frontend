'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SlidersHorizontal, X, Search as SearchIcon, User as UserIcon, Users as UsersIcon } from 'lucide-react';
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
import { cameBackOrForward } from '@/components/layout/ScrollManager';
import AllianceMeetBanner from '@/components/alliance-meet/AllianceMeetBanner';

const EDUCATION_OPTIONS = getAllEducationOptions();

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

function FilterControls({
  country, setCountry,
  state, setState,
  education, setEducation,
  caste, setCaste,
  maritalStatus, setMaritalStatus,
  motherTongue, setMotherTongue,
  sortBy, setSortBy,
  ignoreAge,
  onReset,
}) {
  const hasActiveFilters = country || state || education || caste || maritalStatus || motherTongue || sortBy !== 'newest' || ignoreAge;

  return (
    <div className="space-y-3">
      <div>
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-1">Location</label>
        <Select value={country || 'all'} onValueChange={(v) => setCountry(v === 'all' ? '' : v)}>
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
          <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-1">State</label>
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
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-1">Education</label>
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
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-1">Caste</label>
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
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-1">Marital Status</label>
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
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-1">Mother Tongue</label>
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
        <label className="font-sans text-sm font-medium text-[#1A1A1A] block mb-1">Sort By</label>
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
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters, search and the "outside your age range" list live in the URL
  // (/browse?country=India&outside=1…), so going into a profile and pressing
  // Back brings the member back to exactly the same view.
  const country = searchParams.get('country') || '';
  const state = searchParams.get('state') || '';
  const education = searchParams.get('education') || '';
  const caste = searchParams.get('caste') || '';
  const maritalStatus = searchParams.get('marital') || '';
  const motherTongue = searchParams.get('tongue') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const ignoreAge = searchParams.get('outside') === '1';

  // One URL update per change (two back-to-back updates would each start from
  // the old URL and the second would undo the first).
  const setParams = (updates) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === '' || value == null || value === false || (key === 'sort' && value === 'newest')) next.delete(key);
      else next.set(key, value === true ? '1' : value);
    }
    const qs = next.toString();
    router.replace(qs ? `/browse?${qs}` : '/browse', { scroll: false });
  };
  const setCountry = (v) => setParams({ country: v, ...(v !== 'India' && { state: '' }) });
  const setState = (v) => setParams({ state: v });
  const setEducation = (v) => setParams({ education: v });
  const setCaste = (v) => setParams({ caste: v });
  const setMaritalStatus = (v) => setParams({ marital: v });
  const setMotherTongue = (v) => setParams({ tongue: v });
  const setSortBy = (v) => setParams({ sort: v });
  // Saved scroll position for this exact view (filters included).
  const scrollKey = `browseScroll:${searchParams.toString()}`;

  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 350);

  const outsideRangeSectionRef = useRef(null);

  const filterParams = {
    country, state, education, caste, maritalStatus, motherTongue, sortBy,
    search: debouncedSearch || undefined,
  };
  const filterKey = [country, state, education, caste, maritalStatus, motherTongue, sortBy, debouncedSearch];

  // Browsing is never capped: pages of 20, loaded as the member scrolls (or
  // taps "Show more matches"). Only opening a full profile is metered.
  const fetchPage = (agePreference) => async ({ pageParam = 1 }) => {
    const res = await client.get('/api/profiles/discover', {
      params: { ...filterParams, agePreference, page: pageParam },
    });
    return { profiles: res.data.data || [], pagination: res.data.pagination || {} };
  };
  const nextPage = (lastPage) => (lastPage.pagination?.hasMore ? lastPage.pagination.page + 1 : undefined);

  const {
    data: pagesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['browseProfiles', ...filterKey],
    queryFn: fetchPage('within'),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });

  const { data: interactionData } = useQuery({
    queryKey: ['browseInteractions'],
    queryFn: async () => {
      const [likedRes, shortlistedRes] = await Promise.all([
        client.get('/api/profiles/liked'),
        client.get('/api/profiles/shortlisted'),
      ]);
      return {
        likedIds: likedRes.data.data?.map((p) => p._id) || [],
        shortlistedIds: shortlistedRes.data.data?.map((p) => p._id) || [],
      };
    },
  });

  // "See more profiles outside your preferred age range" — a second list of
  // ONLY out-of-range profiles (so nothing repeats from the grid above),
  // fetched once that link is clicked and paged the same way.
  const {
    data: extraPages,
    isLoading: isExtraLoading,
    fetchNextPage: fetchNextExtraPage,
    hasNextPage: hasNextExtraPage,
    isFetchingNextPage: isFetchingNextExtraPage,
  } = useInfiniteQuery({
    queryKey: ['browseProfilesOutside', ...filterKey],
    queryFn: fetchPage('outside'),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: ignoreAge,
  });

  // Auto-load the next page when the bottom of the in-range grid scrolls
  // into view; the visible button below does the same for anyone who prefers it.
  const loadMoreRef = useRef(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Scroll the newly-revealed section into view below the existing grid,
  // instead of leaving the page where it was (which reads as "nothing
  // happened" when the new profiles render off-screen further down).
  const scrollToOutsideRef = useRef(false);
  useEffect(() => {
    if (!ignoreAge || !scrollToOutsideRef.current) return;
    scrollToOutsideRef.current = false;
    const frame = requestAnimationFrame(() => {
      outsideRangeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [ignoreAge]);

  // Back from a profile: once the (cached) results are on screen again,
  // return to the saved position.
  const restoreRef = useRef(cameBackOrForward(3000));
  useEffect(() => {
    if (!restoreRef.current || isLoading || (ignoreAge && isExtraLoading)) return;
    restoreRef.current = false;
    let y = 0;
    try { y = Number(sessionStorage.getItem(scrollKey)) || 0; } catch { /* not critical */ }
    if (y > 0) requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
  }, [isLoading, isExtraLoading, ignoreAge, scrollKey]);

  // The mobile bottom nav's "Search" tab links here with ?focusSearch=1 to
  // jump straight into the text search box instead of the filter sheet.
  useEffect(() => {
    if (searchParams.get('focusSearch') === '1') {
      searchInputRef.current?.focus();
      setParams({ focusSearch: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Keep the (debounced) search text in the URL too.
  useEffect(() => {
    if ((searchParams.get('q') || '') !== debouncedSearch) setParams({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Remember how far down the member was, and put them back there when they
  // return with Back (e.g. after opening a profile from the outside-range list).
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (restoreRef.current) return; // don't overwrite the position we are about to restore
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try { sessionStorage.setItem(scrollKey, String(window.scrollY)); } catch { /* not critical */ }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, [scrollKey]);

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

  // De-duplicated across pages (a profile can shift pages if someone joins mid-scroll).
  const dedupe = (pages) => {
    const seen = new Set();
    return (pages || []).flatMap((pg) => pg.profiles).filter((p) => (seen.has(p._id) ? false : seen.add(p._id)));
  };
  const profilesData = useMemo(() => dedupe(pagesData?.pages), [pagesData]);
  const totalMatches = pagesData?.pages?.[0]?.pagination?.total ?? profilesData.length;

  const likedIdsSet = useMemo(() => new Set(interactionData?.likedIds || []), [interactionData?.likedIds]);
  const shortlistedIdsSet = useMemo(() => new Set(interactionData?.shortlistedIds || []), [interactionData?.shortlistedIds]);

  const outsideRangeProfiles = useMemo(() => {
    const inRange = new Set(profilesData.map((p) => p._id));
    return dedupe(extraPages?.pages).filter((p) => !inRange.has(p._id));
  }, [extraPages, profilesData]);

  const resetFilters = () => {
    setSearchInput('');
    router.replace('/browse', { scroll: false });
  };

  const activeFilterCount = [country, state, education, caste, maritalStatus, motherTongue, ignoreAge].filter(Boolean).length;

  // Shown below the in-range grid, and below the empty state when nothing
  // matches the preferred age range.
  const outsideRangeBlock = !ignoreAge ? (
    <div className="mt-8 text-center">
      {/* A clear secondary button (gold outline, dark text) rather than a small
          gold link, which was hard to spot on the cream background. */}
      <button
        type="button"
        onClick={() => { scrollToOutsideRef.current = true; setParams({ outside: true }); }}
        className="inline-flex items-center justify-center gap-2 min-h-12 px-6 py-3 rounded-lg border-2 border-[#D4A843] bg-white text-[#1A1A1A] font-sans text-base font-semibold shadow-sm hover:bg-[#F5E6C3]/50 hover:border-[#B8860B] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A843]/60"
      >
        <UsersIcon className="w-5 h-5 text-[#B8860B]" strokeWidth={1.75} aria-hidden="true" />
        See more profiles outside your preferred age range
      </button>
    </div>
  ) : (
    <div ref={outsideRangeSectionRef} className="mt-10 pt-8 border-t border-[#D4A843]/20">
      <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-4">
        Profiles outside your preferred age range
      </h3>
      {isExtraLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#D4A843]/15 shadow-sm overflow-hidden">
              <Skeleton className="aspect-[4/5] rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : outsideRangeProfiles.length === 0 ? (
        <p className="font-sans text-sm text-[#2C3E50]/60">
          No additional profiles found outside your preferred age range.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {outsideRangeProfiles.map((profile) => (
            <ProfileCard
              key={profile._id}
              profile={profile}
              isLiked={likedIdsSet.has(profile._id)}
              isShortlisted={shortlistedIdsSet.has(profile._id)}
            />
          ))}
        </div>
      )}
      {hasNextExtraPage && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => fetchNextExtraPage()}
            disabled={isFetchingNextExtraPage}
            className="h-12 px-6 font-sans border-[#D4A843]/50"
          >
            {isFetchingNextExtraPage ? 'Loading...' : 'Show more profiles'}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF8F0] py-6 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Search Matches
          </h2>

          {/* Mobile filter trigger */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
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
                  ignoreAge={ignoreAge}
                  onReset={resetFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <AllianceMeetBanner />

        {/* Text search — matches on name, occupation, and city. Suggestions
            dropdown surfaces the top few matches while typing; the full grid
            below updates to the same filtered set once the debounce settles. */}
        <div className="relative mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C3E50]/40" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
              placeholder="Search by name, occupation, or city..."
              className="w-full h-12 pl-10 pr-10 rounded-xl border border-[#D4A843]/25 bg-white font-sans text-[15px] text-[#1A1A1A] placeholder:text-[#2C3E50]/40 focus:outline-none focus:ring-2 focus:ring-[#D4A843]/40 focus:border-[#D4A843]/50"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#2C3E50]/40 hover:text-[#2C3E50]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSearchFocused && debouncedSearch.length >= 2 && debouncedSearch === searchInput.trim() && !isLoading && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-[#D4A843]/20 rounded-xl shadow-lg max-h-80 overflow-y-auto">
              {profilesData.length === 0 ? (
                <p className="font-sans text-sm text-[#2C3E50]/60 px-4 py-3">
                  No profiles found for &quot;{debouncedSearch}&quot;
                </p>
              ) : (
                profilesData.slice(0, 6).map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onMouseDown={() => router.push(`/profiles/${p._id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F5E6C3]/40 text-left transition-colors"
                  >
                    {p.profilePicture?.url ? (
                      <span className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                        <Image src={p.profilePicture.url} alt="" fill sizes="36px" unoptimized className="object-cover" />
                      </span>
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-[#F5E6C3] flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-[#B8860B]" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block font-sans text-sm font-medium text-[#1A1A1A] truncate">{p.fullName}</span>
                      <span className="block font-sans text-xs text-[#2C3E50]/60 truncate">
                        {[p.occupation, p.presentResidentialAddress?.city].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
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
                ignoreAge={ignoreAge}
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
              <>
              <div className="flex items-center justify-center py-24">
                <div className="text-center max-w-sm">
                  <p className="font-sans text-lg text-[#1A1A1A] font-medium mb-2">
                    {debouncedSearch
                      ? <>No profiles found for &quot;{debouncedSearch}&quot;</>
                      : 'No profiles found matching your preferences'}
                  </p>
                  <p className="font-sans text-sm text-[#2C3E50]/70">
                    {debouncedSearch
                      ? 'Try a different name, occupation, or city.'
                      : 'Try adjusting your filters, or check back soon as new members join.'}
                  </p>
                  {(activeFilterCount > 0 || debouncedSearch) && (
                    <button
                      onClick={resetFilters}
                      className="mt-4 text-[#D4A843] hover:text-[#B8860B] font-sans font-medium text-sm underline"
                    >
                      {debouncedSearch ? 'Clear search' : 'Reset filters'}
                    </button>
                  )}
                </div>
              </div>
              {/* No in-range matches is exactly when widening the age range helps most. */}
              {outsideRangeBlock}
              </>
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

                <div ref={loadMoreRef} className="mt-6 text-center">
                  <p className="font-sans text-sm text-[#2C3E50]/60 mb-3">
                    Showing {profilesData.length} of {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
                  </p>
                  {hasNextPage && (
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="h-12 px-6 font-sans border-[#D4A843]/50"
                    >
                      {isFetchingNextPage ? 'Loading more matches...' : 'Show more matches'}
                    </Button>
                  )}
                </div>

                {!hasNextPage && outsideRangeBlock}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
