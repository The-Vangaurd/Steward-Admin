"use client";

import { useKanbanColumns } from "@/hooks/useKitchenOrders";
import { KanbanColumn } from "@/components/kitchen/orders/KanbanColumn";
import { ConnectionStatus } from "@/components/kitchen/layout/ConnectionStatus";
import { Flame, ChefHat, CheckCircle2 } from "lucide-react";

export default function KitchenBoardPage() {
  const { newOrders, preparingOrders, readyOrders, isLoading, isError } =
    useKanbanColumns();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0F0F0F]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
        <h1 className="text-[13px] font-semibold text-white/60 uppercase tracking-[0.15em]">
          Kitchen Board
        </h1>
        <ConnectionStatus />
      </div>

      {/* Kanban grid */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden min-h-0">
        <KanbanColumn
          title="New"
          icon={<Flame className="h-4 w-4 text-[#D9B872]" />}
          orders={newOrders}
          status="NEW"
          isLoading={isLoading}
          accentColor="#D9B872"
          emptyText="No new orders"
        />
        <KanbanColumn
          title="Preparing"
          icon={<ChefHat className="h-4 w-4 text-[#C8B6E2]" />}
          orders={preparingOrders}
          status="PREPARING"
          isLoading={isLoading}
          accentColor="#C8B6E2"
          emptyText="Nothing cooking"
        />
        <KanbanColumn
          title="Ready"
          icon={<CheckCircle2 className="h-4 w-4 text-[#92B9A5]" />}
          orders={readyOrders}
          status="READY"
          isLoading={isLoading}
          accentColor="#92B9A5"
          emptyText="Nothing ready yet"
        />
      </div>
    </div>
  );
}
