'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function MembershipSection() {
  const router = useRouter();
  const { membership } = useAuthStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-viga flex items-center gap-2">
          <CreditCard size={20} className="text-primary" />
          Membership & Credits
        </CardTitle>
        <CardDescription className="font-maven">
          Manage your subscription and credits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {membership?.isActive && !membership?.isExpired ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="font-telex text-sm text-gray-600 mb-1">Credits Remaining</p>
                <p className="font-viga text-3xl text-primary">{membership?.credits}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-telex text-sm text-gray-600 mb-1">Expiry Date</p>
                <p className="font-maven text-lg text-secondary">
                  {new Date(membership?.expiryDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-telex text-sm text-gray-600 mb-1">Status</p>
                <Badge className="bg-success text-white font-telex">Active</Badge>
              </div>
            </div>
            <Button
              onClick={() => router.push('/membership/purchase')}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Purchase More Credits
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-viga text-xl text-secondary mb-2">
              {membership?.isExpired ? 'Membership Expired' : 'No Active Membership'}
            </h3>
            <p className="font-maven text-gray-600 mb-4">
              Get a membership to browse profiles
            </p>
            <Button
              onClick={() => router.push('/membership/purchase')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-telex"
            >
              View Membership Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
