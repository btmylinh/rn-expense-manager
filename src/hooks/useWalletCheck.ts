import { useEffect, useState } from 'react';
import { walletApi } from '../api/walletApi';

export function useWalletCheck() {
  const [hasWallets, setHasWallets] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const checkWallets = async () => {
    try {
      setChecking(true);
      const response = await walletApi.getWallets();
      const responseData = response.data;
      const wallets = responseData?.data?.wallets || responseData?.wallets || [];
      setHasWallets(wallets.length > 0);
    } catch (error) {
      console.error('Failed to check wallets:', error);
      setHasWallets(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkWallets();
  }, []);

  return { hasWallets, checking, refetch: checkWallets };
}

