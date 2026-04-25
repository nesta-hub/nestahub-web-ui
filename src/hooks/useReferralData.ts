import { useQuery } from '@tanstack/react-query';
import { getReferralInfo } from '@/lib/api';
import { referralLink } from '@/utils/wallet';

export function useReferralData(token: string | undefined) {
  const query = useQuery({
    queryKey: ['referral-info', token],
    queryFn: () => getReferralInfo(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  const shareLink = query.data ? referralLink(query.data.referralCode) : '';

  const share = async () => {
    if (!query.data) return;
    if (navigator.share) {
      await navigator.share({
        title: 'Join Nesta Hub',
        text: `Use my code ${query.data.referralCode} to sign up on Nesta Hub and get ₦500 off your first order!`,
        url: shareLink,
      });
    } else {
      await navigator.clipboard.writeText(shareLink);
    }
  };

  return {
    info: query.data,
    loading: query.isLoading,
    error: query.error,
    shareLink,
    share,
  };
}
