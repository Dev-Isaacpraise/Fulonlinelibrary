import React, { useState } from "react";
import { Check, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { DeskCirculationStatus } from "../../types";

interface DeskStatusChecklistProps {
  recordId: number;
  bookId: number;
  borrower: string;
  initialStatus?: DeskCirculationStatus | null;
  onStatusChange?: (updated: DeskCirculationStatus) => void;
  readOnly?: boolean;
}

export const DeskStatusChecklist: React.FC<DeskStatusChecklistProps> = ({
  recordId,
  bookId,
  borrower,
  initialStatus,
  onStatusChange,
  readOnly = false,
}) => {
  const [status, setStatus] = useState<DeskCirculationStatus>(() => {
    return (
      initialStatus || {
        record_id: recordId,
        book_id: bookId,
        borrower,
        picked_up: false,
        picked_up_at: null,
        picked_up_by: null,
        returned: false,
        returned_at: null,
        returned_by: null,
        desk_notes: null,
        updated_at: Math.floor(Date.now() / 1000),
      }
    );
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const togglePickedUp = async () => {
    if (readOnly || isUpdating) return;
    const newPickedUp = !status.picked_up;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/desk-status/${recordId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          picked_up: newPickedUp,
          returned: newPickedUp ? status.returned : false, // if unpicking, can't be returned
          borrower,
          book_id: bookId,
          staff_name: "FUL Circulation Desk",
          desk_notes: newPickedUp
            ? "Volume collected at circulation desk."
            : "Physical pickup pending.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setStatus(data.data);
          onStatusChange?.(data.data);
        }
      }
    } catch (e) {
      console.error("Failed to update desk pickup status:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleReturned = async () => {
    if (readOnly || isUpdating) return;
    const newReturned = !status.returned;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/desk-status/${recordId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          picked_up: true, // must have been picked up to be returned
          returned: newReturned,
          borrower,
          book_id: bookId,
          staff_name: "FUL Circulation Desk",
          desk_notes: newReturned
            ? "Physical volume returned to circulation desk."
            : "Awaiting physical return.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setStatus(data.data);
          onStatusChange?.(data.data);
        }
      }
    } catch (e) {
      console.error("Failed to update desk return status:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-[8px] bg-[#FAFAFA] border border-[#E5E5E5] p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-mono-ledger text-[#666666]">
          Circulation Desk Verification
        </span>
        {status.picked_up && status.returned ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0F766E]">
            <CheckCircle2 className="w-3 h-3" /> Fully Returned
          </span>
        ) : status.picked_up ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0F766E]">
            <Check className="w-3 h-3" /> Handed to Borrower
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#EA580C]">
            <Clock className="w-3 h-3" /> Awaiting Desk Pickup
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Checkbox 1: Picked Up */}
        <button
          type="button"
          onClick={togglePickedUp}
          disabled={readOnly || isUpdating}
          className={`w-full flex items-center gap-2.5 p-2 rounded-[6px] border text-left transition-all cursor-pointer ${
            status.picked_up
              ? "bg-[#F0FDFA] border-[#99F6E4] text-[#0F766E]"
              : "bg-[#FFFFFF] border-[#E5E5E5] text-[#666666] hover:border-[#1A1A1A]"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors ${
              status.picked_up
                ? "bg-[#0F766E] border-transparent text-white"
                : "border-[#D4D4D4] bg-transparent"
            }`}
          >
            {status.picked_up && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-[11px] leading-tight text-[#1A1A1A]">
              Physical Book Picked Up
            </span>
            <span className="text-[10px] text-[#666666] truncate">
              {status.picked_up ? "Collected at library desk" : "Click to mark as picked up"}
            </span>
          </div>
        </button>

        {/* Checkbox 2: Returned */}
        <button
          type="button"
          onClick={toggleReturned}
          disabled={readOnly || isUpdating}
          className={`w-full flex items-center gap-2.5 p-2 rounded-[6px] border text-left transition-all cursor-pointer ${
            status.returned
              ? "bg-[#F0FDFA] border-[#99F6E4] text-[#0F766E]"
              : "bg-[#FFFFFF] border-[#E5E5E5] text-[#666666] hover:border-[#1A1A1A]"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors ${
              status.returned
                ? "bg-[#0F766E] border-transparent text-white"
                : "border-[#D4D4D4] bg-transparent"
            }`}
          >
            {status.returned && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-[11px] leading-tight text-[#1A1A1A]">
              Physical Book Returned
            </span>
            <span className="text-[10px] text-[#666666] truncate">
              {status.returned ? "Handed over to staff" : "Click to mark as returned"}
            </span>
          </div>
        </button>
      </div>

      {status.desk_notes && (
        <p className="text-[10px] text-[#666666] font-mono-ledger pt-0.5">
          Note: {status.desk_notes}
        </p>
      )}
    </div>
  );
};
