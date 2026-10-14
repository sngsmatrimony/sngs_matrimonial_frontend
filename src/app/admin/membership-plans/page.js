'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import adminClient from '@/lib/api/adminClient';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildPlanDescription } from '@/lib/planDescription';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit2, Trash2, Star } from 'lucide-react';

// The 3 metered activities — each maps to exactly one real credit-charging
// point in the backend (see creditCost.service.js's chargeCredits). An admin
// sets either a numeric per-use cost, or marks the activity unlimited (free
// regardless of credit balance) for this plan.
const COST_ACTIVITIES = [
  {
    key: 'profileView',
    label: 'Profile View',
    description: 'Credits spent the first time a member opens another profile\'s full details. Re-opening the same profile is free while the membership stays active; after a lapse and renewal it is charged again.',
  },
  {
    key: 'phoneAndChat',
    label: 'Phone Number & Chat',
    description: "Credits spent to reveal a profile's phone number and start a chat with them, together as one unlock.",
  },
  {
    key: 'profileDownload',
    label: 'Profile Download',
    description: 'Credits spent to download a profile as PDF/PPTX or download their horoscope document — one combined unlock covers both.',
  },
];

const DEFAULT_COSTS = Object.fromEntries(
  COST_ACTIVITIES.map((a) => [a.key, { unlimited: false, cost: '' }])
);

export default function AdminMembershipPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    credits: '',
    price: '',
    validityDays: '',
    isDefault: false,
    isUnlimited: false,
    costs: DEFAULT_COSTS,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await adminClient.get('/api/admin/membership-plans');
      setPlans(response.data.data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toastError('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      const planCosts = plan.costs || {};
      setFormData({
        name: plan.name,
        description: plan.description || '',
        credits: String(plan.credits),
        price: String(plan.price.amount),
        validityDays: plan.validityDays === null ? '' : String(plan.validityDays),
        isDefault: plan.isDefault || false,
        isUnlimited: plan.validityDays === null,
        costs: Object.fromEntries(
          COST_ACTIVITIES.map((a) => [
            a.key,
            {
              unlimited: !!planCosts[a.key]?.unlimited,
              cost: planCosts[a.key]?.unlimited ? '' : String(planCosts[a.key]?.cost ?? ''),
            },
          ])
        ),
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        credits: '',
        price: '',
        validityDays: '',
        isDefault: false,
        isUnlimited: false,
        costs: DEFAULT_COSTS,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    // Validation
    if (!formData.name.trim()) {
      toastError('Plan name is required');
      return;
    }
    if (!formData.credits || parseInt(formData.credits) <= 0) {
      toastError('Credits must be greater than 0');
      return;
    }
    if (!formData.price || parseInt(formData.price) <= 0) {
      toastError('Price must be greater than 0');
      return;
    }
    if (!formData.isUnlimited && (!formData.validityDays || parseInt(formData.validityDays) <= 0)) {
      toastError('Validity days must be greater than 0 or set as unlimited');
      return;
    }
    for (const activity of COST_ACTIVITIES) {
      const entry = formData.costs[activity.key];
      if (!entry.unlimited && (entry.cost === '' || parseInt(entry.cost) < 0)) {
        toastError(`${activity.label} cost must be 0 or greater, or marked unlimited`);
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        credits: parseInt(formData.credits),
        price: {
          amount: parseInt(formData.price),
          currency: 'INR',
        },
        validityDays: formData.isUnlimited ? null : parseInt(formData.validityDays),
        isDefault: formData.isDefault,
        costs: Object.fromEntries(
          COST_ACTIVITIES.map((a) => [
            a.key,
            {
              unlimited: formData.costs[a.key].unlimited,
              cost: formData.costs[a.key].unlimited ? 0 : parseInt(formData.costs[a.key].cost) || 0,
            },
          ])
        ),
      };

      if (editingPlan) {
        // Update existing plan
        await adminClient.put(`/api/admin/membership-plans/${editingPlan._id}`, payload);
        toastSuccess('Plan updated successfully');
      } else {
        // Create new plan
        await adminClient.post('/api/admin/membership-plans', payload);
        toastSuccess('Plan created successfully');
      }

      setIsDialogOpen(false);
      await fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toastError(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    try {
      setIsSaving(true);
      await adminClient.delete(`/api/admin/membership-plans/${planToDelete._id}`);
      toastSuccess('Plan deleted successfully');
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      const message = error.response?.data?.message || 'Failed to delete plan';
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await adminClient.put(`/api/admin/membership-plans/${plan._id}`, {
        ...plan,
        isActive: !plan.isActive,
      });
      toastSuccess(
        plan.isActive ? 'Plan deactivated' : 'Plan activated'
      );
      await fetchPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toastError('Failed to update plan status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="font-sans text-secondary">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-secondary mb-2">Membership Plans</h1>
          <p className="font-sans text-gray-600">
            Create and manage membership plans
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <p className="font-sans text-lg text-gray-600 mb-4">
                No membership plans yet
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan._id}
              className={`relative transition-all pt-10 ${
                !plan.isActive ? 'opacity-60' : ''
              }`}
            >
              {plan.isDefault && (
                <div className="absolute top-2 right-4">
                  <Badge className="bg-accent text-accent-foreground flex items-center gap-1 font-sans">
                    <Star className="w-3 h-3" />
                    Default
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-serif text-xl text-secondary">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="font-sans mt-1">
                      {buildPlanDescription(plan)}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`ml-2 font-sans ${
                      plan.isActive
                        ? 'bg-success text-black'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Plan Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-sans text-xs text-gray-600 mb-1">
                      Credits
                    </p>
                    <p className="font-serif text-2xl text-secondary">
                      {plan.credits}
                    </p>
                  </div>
                  <div>
                    <p className="font-sans text-xs text-gray-600 mb-1">
                      Price
                    </p>
                    <p className="font-serif text-2xl text-secondary">
                      ₹{plan.price.amount}
                    </p>
                    <p className="font-sans text-[11px] text-gray-500">+ gateway charges paid by member</p>
                  </div>
                  <div>
                    <p className="font-sans text-xs text-gray-600 mb-1">
                      Validity
                    </p>
                    <p className="font-sans">
                      {plan.validityDays === null || plan.validityDays === undefined
                        ? 'Unlimited'
                        : `${plan.validityDays} day${plan.validityDays !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div>
                    <p className="font-sans text-xs text-gray-600 mb-1">
                      Price/Credit
                    </p>
                    <p className="font-sans">
                      ₹{(plan.price.amount / plan.credits).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Credit Costs summary */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COST_ACTIVITIES.map((activity) => {
                    const entry = plan.costs?.[activity.key];
                    return (
                      <Badge key={activity.key} variant="outline" className="font-sans text-xs">
                        {activity.label}: {entry?.unlimited ? 'Free' : `${entry?.cost ?? 0} cr`}
                      </Badge>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleOpenDialog(plan)}
                    size="sm"
                    variant="outline"
                    className="flex-1 font-sans"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setPlanToDelete(plan);
                      setIsDeleteDialogOpen(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 font-sans"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    onClick={() => handleToggleActive(plan)}
                    size="sm"
                    variant="outline"
                    className="flex-1 font-sans"
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-serif">
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription className="font-sans">
              {editingPlan
                ? 'Update the plan details below'
                : 'Fill in the details to create a new membership plan'}
            </DialogDescription>
          </DialogHeader>

          {/* display:contents keeps this transparent to the DialogContent
              flex layout (the scroll area below still needs flex-1 from its
              direct parent) while giving every single-line Input in the
              dialog native Enter-to-submit — a <textarea> like Description
              is unaffected, Enter there still just inserts a newline. */}
          <form onSubmit={(e) => { e.preventDefault(); handleSavePlan(); }} className="contents">
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 -mr-1">
            {/* Name */}
            <div>
              <Label className="font-sans text-sm">Plan Name *</Label>
              <Input
                placeholder="e.g., Starter Plan"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="font-sans mt-1"
              />
            </div>

            {/* Description — generated from the credit costs below so it always
                matches the real prices; updates live as costs change. */}
            <div>
              <Label className="font-sans text-sm">Description (shown to members)</Label>
              <p className="font-sans text-sm text-[#1A1A1A] mt-1 p-3 rounded-lg bg-[#FDF8F0] border border-[#D4A843]/20 leading-relaxed">
                {buildPlanDescription({
                  costs: Object.fromEntries(
                    Object.entries(formData.costs).map(([key, entry]) => [
                      key,
                      { unlimited: entry.unlimited, cost: parseInt(entry.cost, 10) || 0 },
                    ])
                  ),
                })}
              </p>
              <p className="font-sans text-xs text-gray-500 mt-1">
                Written automatically from the credit costs you set below.
              </p>
            </div>

            {/* Credits */}
            <div>
              <Label className="font-sans text-sm">Credits *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 10"
                value={formData.credits}
                onChange={(e) =>
                  setFormData({ ...formData, credits: e.target.value })
                }
                className="font-sans mt-1"
              />
            </div>

            {/* Price */}
            <div>
              <Label className="font-sans text-sm">Price (₹) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 1000"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="font-sans mt-1"
              />
            </div>

            {/* Validity Days */}
            <div>
              <Label className="font-sans text-sm">Validity (Days) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 30"
                value={formData.validityDays}
                onChange={(e) =>
                  setFormData({ ...formData, validityDays: e.target.value })
                }
                disabled={formData.isUnlimited}
                className="font-sans mt-1"
              />
            </div>

            {/* Unlimited Validity */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="isUnlimited"
                checked={formData.isUnlimited}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isUnlimited: checked, validityDays: checked ? '' : formData.validityDays })
                }
              />
              <Label htmlFor="isUnlimited" className="font-sans text-sm cursor-pointer">
                Unlimited validity (no expiry)
              </Label>
            </div>

            {/* Set as Default */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
              <Label htmlFor="isDefault" className="font-sans text-sm cursor-pointer">
                Set as default plan
              </Label>
            </div>

            {/* Credit Costs per activity */}
            <div className="pt-3 border-t border-[#D4A843]/15 space-y-4">
              <Label className="font-sans text-sm font-semibold text-[#1A1A1A]">Credit Costs</Label>
              {COST_ACTIVITIES.map((activity) => {
                const entry = formData.costs[activity.key];
                return (
                  <div key={activity.key} className="space-y-2 p-3 bg-[#FDF8F0] rounded-lg">
                    <Label className="font-sans text-sm font-medium text-[#1A1A1A]">{activity.label}</Label>
                    <p className="font-sans text-xs text-gray-500">{activity.description}</p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g., 10"
                        value={entry.cost}
                        disabled={entry.unlimited}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            costs: { ...formData.costs, [activity.key]: { ...entry, cost: e.target.value } },
                          })
                        }
                        className="font-sans max-w-32"
                      />
                      <span className="font-sans text-xs text-gray-500">credits</span>
                      <div className="flex items-center gap-2 ml-auto">
                        <Checkbox
                          id={`${activity.key}-unlimited`}
                          checked={entry.unlimited}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              costs: { ...formData.costs, [activity.key]: { unlimited: checked, cost: checked ? '' : entry.cost } },
                            })
                          }
                        />
                        <Label htmlFor={`${activity.key}-unlimited`} className="font-sans text-xs cursor-pointer whitespace-nowrap">
                          Free / Unlimited
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="font-sans"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Plan'
              )}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {planToDelete?.name} will be permanently deleted. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setPlanToDelete(null);
              }}
              disabled={isSaving}
              className="font-sans"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white font-sans"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
