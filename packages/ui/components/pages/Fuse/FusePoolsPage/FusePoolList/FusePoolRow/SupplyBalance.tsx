import { Text, VStack } from '@chakra-ui/react';

import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { PoolData } from '@ui/types/TokensDataMap';
import { longFormat, smallUsdFormatter } from '@ui/utils/bigUtils';

export const SupplyBalance = ({ pool }: { pool: PoolData }) => {
  const { address } = useMultiMidas();

  return (
    <VStack alignItems={'flex-end'} px={{ base: 2, lg: 4 }} justifyContent="center" height="100%">
      {address ? (
        <SimpleTooltip label={`$${longFormat(pool.totalSupplyBalanceFiat)}`}>
          <Text variant="smText" fontWeight="bold" textAlign="center">
            {smallUsdFormatter(pool.totalSupplyBalanceFiat)}
            {pool.totalSupplyBalanceFiat > 0 && pool.totalSupplyBalanceFiat < 0.01 && '+'}
          </Text>
        </SimpleTooltip>
      ) : (
        <SimpleTooltip label="Connect your wallet">
          <Text variant="smText" fontWeight="bold" textAlign="center">
            -
          </Text>
        </SimpleTooltip>
      )}
    </VStack>
  );
};