import { FlywheelClaimableRewards } from '@midas-capital/sdk/dist/cjs/src/modules/Flywheel';
import { useQuery } from '@tanstack/react-query';

import { useMidas } from '@ui/context/MidasContext';

export const useAssetClaimableRewards = ({
  poolAddress,
  assetAddress,
}: {
  poolAddress: string;
  assetAddress: string;
}) => {
  const { midasSdk, address } = useMidas();

  return useQuery<FlywheelClaimableRewards[] | undefined>(
    ['useAssetClaimableRewards', poolAddress, assetAddress, address],
    () => midasSdk.getFlywheelClaimableRewardsForAsset(poolAddress, assetAddress, address),
    { enabled: !!poolAddress && !!address }
  );
};
