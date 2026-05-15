import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { referralLink } from '@/utils/wallet';

interface Props {
  referralCode: string;
  onShare: () => Promise<void>;
}

export function ReferralCard({ referralCode, onShare }: Props) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await onShare();
    } finally {
      setSharing(false);
    }
  };

  return (
    <Card className="p-6 space-y-5 text-center">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Your referral code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl font-bold tracking-widest text-foreground font-mono">
            {referralCode}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Copy code"
          >
            {copied
              ? <Check className="w-5 h-5 text-emerald-600" />
              : <Copy className="w-5 h-5 text-muted-foreground" />
            }
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Share your code and earn <span className="font-semibold text-foreground">₦500</span> when a friend completes their first order.
      </p>

      <Button
        variant="shop"
        className="w-full h-12"
        onClick={handleShare}
        disabled={sharing}
      >
        <Share2 className="w-4 h-4 mr-2" />
        {sharing ? 'Sharing...' : 'Share Link'}
      </Button>

      <p className="text-xs text-muted-foreground break-all">{referralLink(referralCode)}</p>
    </Card>
  );
}
