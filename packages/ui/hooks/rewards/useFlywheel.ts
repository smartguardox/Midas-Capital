import { useQuery } from '@tanstack/react-query';

import { useMidas } from '@ui/context/MidasContext';
import { Flywheel } from '@ui/types/ComponentPropsType';

export const useFlywheel = (flywheelAddress?: string) => {
  const { midasSdk, currentChain } = useMidas();

  return useQuery(
    ['useFlywheel', currentChain.id, flywheelAddress],
    async () => {
      if (!flywheelAddress) return undefined;
      if (!midasSdk) return undefined;

      const flywheel = midasSdk.createMidasFlywheel(flywheelAddress);

      // TODO add function to FlywheelLensRouter to get all info in one call
      const [booster, rewards, markets, owner, rewardToken] = await Promise.all([
        flywheel.callStatic.flywheelBooster(),
        flywheel.callStatic.flywheelRewards(),
        flywheel.callStatic.getAllStrategies(),
        flywheel.callStatic.owner(),
        flywheel.callStatic.rewardToken(),
      ]);

      return {
        address: flywheel.address,
        booster,
        owner,
        rewards,
        rewardToken,
        markets,
      } as Flywheel;
    },
    {
      initialData: undefined,
      enabled: !!flywheelAddress && !!currentChain && !!midasSdk,
    }
  );
};
