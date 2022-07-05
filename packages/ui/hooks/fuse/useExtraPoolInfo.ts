import { useQuery } from 'react-query';

import { useRari } from '@ui/context/RariContext';

export const useExtraPoolInfo = (comptrollerAddress: string) => {
  const { fuse, currentChain, address } = useRari();

  const { data } = useQuery(['ExtraPoolInfo', currentChain.id, comptrollerAddress], async () => {
    if (comptrollerAddress) {
      const comptroller = fuse.createComptroller(comptrollerAddress);
      const oracle = fuse.getPriceOracle(await comptroller.callStatic.oracle());
      const [
        { 0: admin, 1: upgradeable },
        closeFactor,
        liquidationIncentive,
        enforceWhitelist,
        whitelist,
        pendingAdmin,
      ] = await Promise.all([
        fuse.contracts.FusePoolLensSecondary.callStatic.getPoolOwnership(comptrollerAddress),

        comptroller.callStatic.closeFactorMantissa(),

        comptroller.callStatic.liquidationIncentiveMantissa(),

        // TODO wtf?
        (() => {
          return comptroller.callStatic
            .enforceWhitelist()
            .then((x: boolean) => x)
            .catch(() => false);
        })(),

        (() => {
          return comptroller.callStatic
            .getWhitelist()
            .then((x: string[]) => x)
            .catch(() => []);
        })(),

        comptroller.callStatic.pendingAdmin(),
      ]);

      return {
        admin,
        upgradeable,
        enforceWhitelist,
        whitelist: whitelist as string[],
        isPowerfulAdmin: admin.toLowerCase() === address.toLowerCase() && upgradeable,
        oracle,
        closeFactor,
        liquidationIncentive,
        pendingAdmin,
        isPendingAdmin: pendingAdmin.toLowerCase() === address.toLowerCase(),
      };
    }
  });

  return data;
};