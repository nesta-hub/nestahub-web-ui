import { Card } from '@/components/ui/card';
import { formatKobo } from '@/utils/wallet';
import type { ReferralInfo } from '@/lib/api';

interface Props {
  info: ReferralInfo;
}

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center">
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </div>
);

export function ReferralStats({ info }: Props) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-foreground mb-4">Your Referrals</p>
      <div className="grid grid-cols-3 gap-4 divide-x divide-border">
        <Stat label="Total Referred" value={info.totalReferrals} />
        <Stat label="Completed" value={info.completedReferrals} />
        <Stat label="Total Earned" value={formatKobo(info.totalEarned)} />
      </div>
      {info.pendingReferrals > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          {info.pendingReferrals} pending — reward credited after first delivery
        </p>
      )}
    </Card>
  );
}
