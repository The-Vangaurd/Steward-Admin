"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Save, RotateCcw, Loader2, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings, useUpdateRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { useAuth } from "@/hooks/useAuth";
import { TabGeneral } from "@/components/settings/TabGeneral";
import { TabTheme } from "@/components/settings/TabTheme";
import { TabOperations } from "@/components/settings/TabOperations";
import { TabStaffNotifications } from "@/components/settings/TabStaffNotifications";
import { TabBranding } from "@/components/settings/TabBranding";
import { TabShifts } from "@/components/settings/TabShifts";
import { TabSecurity } from "@/components/settings/TabSecurity";
import { TabPayments } from "@/components/settings/TabPayments";
import { TabOrderTypes } from "@/components/settings/TabOrderTypes";
import { TabCustomerExperience } from "@/components/settings/TabCustomerExperience";
import type { RestaurantSettings } from "@/types/settings";

export default function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const { data: serverSettings, isLoading, isError } = useRestaurantSettings();
  const { mutate: save, isPending: isSaving } = useUpdateRestaurantSettings();

  const [draft, setDraft]     = useState<RestaurantSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Sync active tab from query parameters
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // Warn the user before they navigate away with unsaved changes (FIX 7.4)
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (activeTab === "security" && !isAdmin) {
      setActiveTab("general");
    }
  }, [activeTab, isAdmin]);

  // Sync draft from server data
  useEffect(() => {
    if (serverSettings && !isDirty) {
      setDraft(serverSettings);
    }
  }, [serverSettings, isDirty]);

  const patch = (partial: Partial<RestaurantSettings>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!draft) return;
    save(draft, {
      onSuccess: (savedSettings) => {
        setDraft(prev => prev ? { ...prev, ...savedSettings } : savedSettings);
        setIsDirty(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      },
    });
  };

  const handleReset = () => {
    if (serverSettings) {
      setDraft(serverSettings);
      setIsDirty(false);
    }
  };

  const tabs = [
    { value: "general",    label: "General" },
    { value: "theme",      label: "Theme & Menu" },
    { value: "operations", label: "Operations" },
    { value: "team",       label: "Team & Notifications" },
    { value: "payments",   label: "Payments" },
    { value: "ordering",   label: "Ordering & Tables" },
    { value: "customer",   label: "Customer Experience" },
    { value: "branding",   label: "Branding" },
    { value: "shifts",     label: "Shifts" },
  ];

  if (isAdmin) {
    tabs.push({ value: "security", label: "Security" });
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[13px] text-fg-subtle">Failed to load settings.</p>
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-fg-subtle" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[13px] text-fg-subtle">Settings unavailable.</p>
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 max-w-[860px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="label-xs mb-1">Configuration</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Restaurant Settings</h2>
          <p className="text-[12px] text-fg-subtle mt-1">
            Manage your restaurant profile, branding, and operations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="text-fg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={(!isDirty && !isSaved) || isSaving}
            className={isSaved ? 'bg-success hover:bg-success/90 text-white' : ''}
          >
            {isSaving ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
            ) : isSaved ? (
              <><Check className="h-3.5 w-3.5 mr-1.5" />Saved</>
            ) : (
              <><Save className="h-3.5 w-3.5 mr-1.5" />Save changes</>
            )}
          </Button>
        </div>
      </div>

      {isDirty && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/8 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
          <span className="text-[12px] text-warning font-medium">You have unsaved changes</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-surface border border-border p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[12px] font-medium data-[state=active]:bg-surface-3 data-[state=active]:text-fg rounded-md px-3 py-1.5"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general">
          <TabGeneral settings={draft} onChange={patch} />
        </TabsContent>
        <TabsContent value="theme">
          <TabTheme settings={draft} onChange={patch} />
        </TabsContent>
        <TabsContent value="operations">
          <TabOperations settings={draft} onChange={patch} />
        </TabsContent>
        <TabsContent value="team">
          <TabStaffNotifications settings={draft} onChange={patch} />
        </TabsContent>
        <TabsContent value="payments">
          <TabPayments settings={draft} onChange={patch} />
        </TabsContent>
        <TabsContent value="ordering">
          <TabOrderTypes settings={draft} onChange={patch} />
        </TabsContent>
        <TabsContent value="customer">
          <TabCustomerExperience settings={draft} onChange={patch} />
        </TabsContent>
        <TabsContent value="branding">
          <TabBranding settings={draft} onChange={patch} />
        </TabsContent>
        <TabsContent value="shifts">
          <TabShifts />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="security">
            <TabSecurity />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
