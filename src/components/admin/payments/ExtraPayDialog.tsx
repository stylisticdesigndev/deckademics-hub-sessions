import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ExtraPayDraft,
  ExtraPayItem,
  useInstructorPaymentExtras,
} from '@/hooks/useInstructorPaymentExtras';

interface DraftRow extends ExtraPayDraft {
  _key: string;
}

interface ExtraPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
  instructorId: string | null;
  instructorName?: string;
  /** Existing extras to pre-fill the dialog with */
  existing: ExtraPayItem[];
  /** Optional callback after a successful save */
  onSaved?: () => void;
}

/**
 * Dialog for adding multiple individual Extra Pay line items
 * (date + description + amount) to an instructor payment.
 * Replaces the legacy single "bonus" flow.
 */
export const ExtraPayDialog = ({
  open,
  onOpenChange,
  paymentId,
  instructorId,
  instructorName,
  existing,
  onSaved,
}: ExtraPayDialogProps) => {
  const { saveExtras } = useInstructorPaymentExtras();

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset state when the dialog opens with a different payment
  useEffect(() => {
    if (!open) return;
    setDrafts(
      existing.map((e, i) => ({
        _key: `existing-${e.id}-${i}`,
        event_date: e.event_date,
        description: e.description,
        amount: Number(e.amount) || 0,
      })),
    );
    setNewDate(format(new Date(), 'yyyy-MM-dd'));
    setNewDesc('');
    setNewAmount('');
  }, [open, existing]);

  const totalAmount = drafts.reduce((acc, d) => acc + (d.amount || 0), 0);

  const handleAddLine = () => {
    const amount = parseFloat(newAmount);
    if (!newDate || isNaN(amount) || amount <= 0) {
      return;
    }
    setDrafts((prev) => [
      ...prev,
      {
        _key: `new-${Date.now()}-${Math.random()}`,
        event_date: newDate,
        description: newDesc.trim() || null,
        amount,
      },
    ]);
    setNewDesc('');
    setNewAmount('');
  };

  const handleRemoveLine = (key: string) => {
    setDrafts((prev) => prev.filter((d) => d._key !== key));
  };

  const handleSave = async () => {
    if (!paymentId || !instructorId) return;
    setSaving(true);
    const ok = await saveExtras(
      paymentId,
      instructorId,
      drafts.map((d) => ({
        event_date: d.event_date,
        description: d.description,
        amount: d.amount,
      })),
    );
    setSaving(false);
    if (ok) {
      onSaved?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Extra Pay</DialogTitle>
          <DialogDescription>
            Log one-off events, gigs, or bonuses with their own date, description,
            and pay rate. Each line item is shown to the instructor on their pay ledger.
            {instructorName ? ` For: ${instructorName}.` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Line items ({drafts.length})
            </Label>
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground border border-dashed rounded p-3 text-center">
                No extra pay added yet.
              </p>
            ) : (
              <div className="space-y-2">
                {drafts.map((item) => (
                  <div
                    key={item._key}
                    className="flex items-center gap-2 border rounded p-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.description || 'Extra pay'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(item.event_date), 'MM/dd/yyyy')}
                      </div>
                    </div>
                    <div className="font-semibold whitespace-nowrap">
                      ${item.amount.toFixed(2)}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveLine(item._key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end text-sm font-semibold pt-1">
                  Total: ${totalAmount.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Add new line item
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="extra-date" className="text-xs">
                  Date
                </Label>
                <Input
                  id="extra-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="extra-amount" className="text-xs">
                  Pay rate ($)
                </Label>
                <Input
                  id="extra-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="150.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="extra-desc" className="text-xs">
                Description
              </Label>
              <Input
                id="extra-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Open-deck event at The Lot"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
              <Plus className="h-4 w-4 mr-1" /> Add line item
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !paymentId}>
            {saving ? 'Saving...' : 'Save Extra Pay'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};