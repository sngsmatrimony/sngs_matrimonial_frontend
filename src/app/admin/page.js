'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, User, Clock, ArrowRight } from 'lucide-react';

function StatsCard({ icon: Icon, label, value, subtitle, color = 'text-primary' }) {
  return (
    <Card className="border-[#D4A843]/15">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#2C3E50]/70 font-sans">{label}</p>
            <p className="text-3xl font-bold font-serif mt-2 text-[#1A1A1A]">{value.toLocaleString()}</p>
            {subtitle && <p className="text-xs text-[#2C3E50]/50 mt-1 font-sans">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br from-[#F5E6C3]/60 to-[#F5E6C3]/20 ${color}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const response = await adminApi.getDashboardAnalytics();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FBEAE5] border border-[#E8B4A0] border-l-4 border-l-[#C75B39] rounded-xl p-4">
        <p className="text-[#8A3B22] font-sans">Error loading analytics. Please try again.</p>
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="font-sans text-[#2C3E50]">No analytics data available</div>;
  }

  const { counts, newUsersToday, newUsersThisWeek, newUsersThisMonth, pendingApprovals, averageAge, genderBreakdown, maritalStatusBreakdown, topCities, topStates, growthChart } = analyticsData;

  const genderChartData = genderBreakdown.map((item) => ({
    name: item._id || 'Unknown',
    value: item.count,
  }));

  // Extract male and female counts from genderBreakdown
  const maleCount = genderBreakdown.find(g => g._id === 'male')?.count || 0;
  const femaleCount = genderBreakdown.find(g => g._id === 'female')?.count || 0;

  const maritalStatusData = maritalStatusBreakdown.map((item) => ({
    name: item._id || 'Unknown',
    value: item.count,
  }));

  const citiesData = topCities.map((item) => ({
    name: item._id || 'Unknown',
    count: item.count,
  }));

  const statesData = topStates.map((item) => ({
    name: item._id || 'Unknown',
    count: item.count,
  }));

  const COLORS = ['#D4A843', '#2C3E50', '#C75B39', '#2E7D32', '#B8860B'];

  return (
    <div className="space-y-6">
      {/* Pending Approvals Alert */}
      {pendingApprovals > 0 && (
        <Link href="/admin/users?approvalFilter=pending">
          <Card className="border-[#D4A843]/30 bg-gradient-to-r from-[#FDF8F0] to-[#F5E6C3]/50 hover:to-[#F5E6C3]/70 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-[#D4A843]/15 text-[#B8860B]">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="font-semibold font-sans text-[#1A1A1A]">
                      {pendingApprovals} {pendingApprovals === 1 ? 'registration' : 'registrations'} awaiting approval
                    </p>
                    <p className="text-sm font-sans text-[#2C3E50]/70">Review pending profiles before they wait too long</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-[#B8860B]" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Users"
          value={counts?.total || 0}
          color="text-primary"
        />
        <StatsCard
          icon={User}
          label="Male Users"
          value={maleCount}
          subtitle={`${((maleCount / (counts?.total || 1)) * 100).toFixed(1)}%`}
          color="text-secondary"
        />
        <StatsCard
          icon={User}
          label="Female Users"
          value={femaleCount}
          subtitle={`${((femaleCount / (counts?.total || 1)) * 100).toFixed(1)}%`}
          color="text-accent"
        />
        <StatsCard
          icon={Users}
          label="Average Age"
          value={Math.round(averageAge || 0)}
          subtitle="years"
          color="text-secondary"
        />
      </div>

      {/* New Users Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#D4A843]/15">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-[#1A1A1A]">New Users Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-serif text-[#D4A843]">{newUsersToday}</p>
          </CardContent>
        </Card>

        <Card className="border-[#D4A843]/15">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-[#1A1A1A]">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-serif text-[#C75B39]">{newUsersThisWeek}</p>
          </CardContent>
        </Card>

        <Card className="border-[#D4A843]/15">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-[#1A1A1A]">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-serif text-[#2E7D32]">{newUsersThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      {growthChart && growthChart.length > 0 && (
        <Card className="border-[#D4A843]/15">
          <CardHeader>
            <CardTitle className="font-serif text-[#1A1A1A]">User Growth (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4A843" strokeOpacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#2C3E50"
                  dot={{ fill: '#D4A843', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gender & Marital Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {genderChartData.length > 0 && (
          <Card className="border-[#D4A843]/15">
            <CardHeader>
              <CardTitle className="font-serif text-[#1A1A1A]">Gender Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={genderChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {maritalStatusData.length > 0 && (
          <Card className="border-[#D4A843]/15">
            <CardHeader>
              <CardTitle className="font-serif text-[#1A1A1A]">Marital Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={maritalStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D4A843" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#D4A843" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Cities & States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {citiesData.length > 0 && (
          <Card className="border-[#D4A843]/15">
            <CardHeader>
              <CardTitle className="font-serif text-[#1A1A1A]">Top Cities</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={citiesData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D4A843" strokeOpacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2C3E50" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {statesData.length > 0 && (
          <Card className="border-[#D4A843]/15">
            <CardHeader>
              <CardTitle className="font-serif text-[#1A1A1A]">Top States</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statesData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D4A843" strokeOpacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#C75B39" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
