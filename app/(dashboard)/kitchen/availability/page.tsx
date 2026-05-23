import { AvailabilityPanel } from "@/components/kitchen/availability/AvailabilityPanel";

export default function KitchenAvailabilityPage() {
  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="label-xs mb-1">Kitchen</div>
        <h2 className="text-xl font-semibold tracking-tight text-fg">Item Availability</h2>
        <p className="text-[12px] text-fg-subtle mt-1">
          Changes broadcast to customer menus in real-time.
        </p>
      </div>
      <AvailabilityPanel />
    </div>
  );
}
