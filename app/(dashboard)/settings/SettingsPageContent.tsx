"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings, useUpdateRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { TabGeneral } from "@/components/settings/TabGeneral";
import { TabTheme } from "@/components/settings/TabTheme";
import { TabOperations } from "@/components/settings/TabOperations";
import { TabStaffNotifications } from "@/components/settings/TabStaffNotifications";
import type { RestaurantSettings } from "@/types/settings";

export default function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { data: serverSettings, isLoading, isError } = useRestaurantSettings();
  const { mutate: save, isPending: isSaving } = useUpdateRestaurantSettings();

  const [draft, setDraft]     = useState<RestaurantSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Sync active tab from query parameters
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) {
      setActiveTab(t);
    }
  }, [searchParams]);

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
      onSuccess: () => {
        setIsDirty(false);
      },
    });
  };

  const handleReset = () => {
    if (serverSettings) {
      setDraft(serverSettings);
      setIsDirty(false);
    }
  };

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
            disabled={!isDirty || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isSaving ? "Saving…" : "Save changes"}
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
          {[
            { value: "general",    label: "General" },
            { value: "theme",      label: "Theme & Menu" },
            { value: "operations", label: "Operations" },
            { value: "team",       label: "Team & Notifications" },
          ].map((tab) => (
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
      </Tabs>
    </div>
  );
}
