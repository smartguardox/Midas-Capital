import { useQuery } from '@tanstack/react-query';

import { useMidas } from '@ui/context/MidasContext';

export const useRewardTokensOfPool = (poolAddress?: string) => {
  const {
    midasSdk,
    currentChain: { id },
  } = useMidas();

  const { data } = useQuery(
    ['useRewardTokensOfPool', id, poolAddress],
    async () => {
      if (!poolAddress) return undefined;

      const rewards = await midasSdk.getFlywheelMarketRewardsByPool(poolAddress);

      return rewards
        .flatMap((r) => r.rewardsInfo)
        .map((ri) => ri.rewardToken)
        .filter((value, index, self) => self.indexOf(value) === index);
    },
    { enabled: !!poolAddress, placeholderData: [] }
  );

  return data || [];
};
