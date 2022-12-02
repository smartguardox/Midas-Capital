import { Divider, Skeleton, Text } from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';
import { BigNumber, utils } from 'ethers';
import { useMemo } from 'react';

import { MidasBox } from '@ui/components/shared/Box';
import { Column, Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import useUpdatedUserAssets from '@ui/hooks/fuse/useUpdatedUserAssets';
import { useBorrowLimitMarket } from '@ui/hooks/useBorrowLimitMarket';
import { useBorrowLimitTotal } from '@ui/hooks/useBorrowLimitTotal';
import { MarketData } from '@ui/types/TokensDataMap';
import { smallUsdFormatter } from '@ui/utils/bigUtils';
import { getBlockTimePerMinuteByChainId } from '@ui/utils/networkData';

interface StatsColumnProps {
  mode: FundOperationMode;
  assets: MarketData[];
  asset: MarketData;
  amount: BigNumber;
  enableAsCollateral?: boolean;
  poolChainId: number;
}
export const StatsColumn = ({
  mode,
  assets,
  asset,
  amount,
  enableAsCollateral = false,
  poolChainId,
}: StatsColumnProps) => {
  const index = useMemo(() => assets.findIndex((a) => a.cToken === asset.cToken), [assets, asset]);
  // Get the new representation of a user's NativePricedFuseAssets after proposing a supply amount.
  const { data: updatedAssets } = useUpdatedUserAssets({
    mode,
    assets,
    index,
    amount,
    poolChainId,
  });

  const updatedAsset = updatedAssets ? updatedAssets[index] : null;

  const { currentSdk, currentChain } = useMultiMidas();
  if (!currentSdk || !currentChain) throw new Error("SDK doesn't exist!");

  const {
    supplyAPY,
    borrowAPR,
    updatedSupplyAPY,
    updatedBorrowAPR,
    supplyBalanceFrom,
    supplyBalanceTo,
    totalBorrows,
    updatedTotalBorrows,
  } = useMemo(() => {
    const blocksPerMinute = getBlockTimePerMinuteByChainId(currentChain.id);
    return {
      supplyAPY: currentSdk.ratePerBlockToAPY(asset.supplyRatePerBlock, blocksPerMinute),
      borrowAPR: currentSdk.ratePerBlockToAPY(asset.borrowRatePerBlock, blocksPerMinute),
      updatedSupplyAPY: updatedAsset
        ? currentSdk.ratePerBlockToAPY(updatedAsset.supplyRatePerBlock, blocksPerMinute)
        : undefined,
      updatedBorrowAPR: updatedAsset
        ? currentSdk.ratePerBlockToAPY(updatedAsset.borrowRatePerBlock, blocksPerMinute)
        : undefined,
      supplyBalanceFrom: utils.commify(
        utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals)
      ),
      supplyBalanceTo: updatedAsset
        ? utils.commify(
            utils.formatUnits(updatedAsset.supplyBalance, updatedAsset.underlyingDecimals)
          )
        : undefined,
      totalBorrows: assets.reduce((acc, cur) => acc + cur.borrowBalanceFiat, 0),
      updatedTotalBorrows: updatedAssets
        ? updatedAssets.reduce((acc, cur) => acc + cur.borrowBalanceFiat, 0)
        : undefined,
    };
  }, [currentChain, updatedAsset, asset, assets, updatedAssets, currentSdk]);

  // Calculate Old and new Borrow Limits
  const borrowLimitTotal = useBorrowLimitTotal(assets, poolChainId);
  const updatedBorrowLimitTotal = useBorrowLimitTotal(updatedAssets ?? [], poolChainId, {
    ignoreIsEnabledCheckFor: enableAsCollateral ? asset.cToken : undefined,
  });
  const borrowLimitMarket = useBorrowLimitMarket(asset, assets, poolChainId);
  const updatedBorrowLimitMarket = useBorrowLimitMarket(asset, updatedAssets ?? [], poolChainId, {
    ignoreIsEnabledCheckFor: enableAsCollateral ? asset.cToken : undefined,
  });

  return (
    <MidasBox width="100%">
      <Column
        mainAxisAlignment="space-between"
        crossAxisAlignment="flex-start"
        expand
        p={4}
        gap={2}
      >
        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text variant="smText" flexShrink={0}>
            Market Supply Balance:
          </Text>
          <SimpleTooltip
            label={`${supplyBalanceFrom}${` → ${supplyBalanceTo} `}${asset.underlyingSymbol}`}
          >
            <Text
              flexShrink={0}
              variant={'smText'}
              textOverflow={'ellipsis'}
              whiteSpace="nowrap"
              overflow="hidden"
            >
              {supplyBalanceFrom.slice(0, supplyBalanceFrom.indexOf('.') + 3)}
              {' ' + asset.underlyingSymbol}
              <>
                {' → '}
                {supplyBalanceTo ? (
                  supplyBalanceTo.slice(0, supplyBalanceTo.indexOf('.') + 3)
                ) : (
                  <Skeleton display="inline">
                    {supplyBalanceFrom.slice(0, supplyBalanceFrom.indexOf('.') + 3)}
                  </Skeleton>
                )}
                {' ' + asset.underlyingSymbol}
              </>
            </Text>
          </SimpleTooltip>
        </Row>

        <Divider />

        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text flexShrink={0} variant="smText">
            Borrowed in Market
          </Text>
          <Text
            variant={'smText'}
            color={
              updatedAsset?.borrowBalanceFiat &&
              updatedBorrowLimitMarket !== undefined &&
              updatedBorrowLimitMarket - updatedAsset.borrowBalanceFiat < -0.001
                ? 'fail'
                : undefined
            }
          >
            {`${smallUsdFormatter(asset.borrowBalanceFiat)} of ${smallUsdFormatter(
              borrowLimitMarket
            )}`}

            {' → '}
            {updatedAssets && updatedAsset ? (
              `${smallUsdFormatter(
                Math.max(updatedAsset.borrowBalanceFiat, 0)
              )} of ${smallUsdFormatter(updatedBorrowLimitMarket)}`
            ) : (
              <Skeleton display="inline">{`${smallUsdFormatter(
                asset.borrowBalanceFiat
              )} of ${smallUsdFormatter(borrowLimitMarket)}`}</Skeleton>
            )}
          </Text>
        </Row>

        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text flexShrink={0} variant="smText">
            Borrowed in Total:
          </Text>
          <Text
            variant={'smText'}
            color={
              updatedTotalBorrows !== undefined &&
              updatedBorrowLimitTotal !== undefined &&
              updatedTotalBorrows / updatedBorrowLimitTotal >= 0.8
                ? updatedTotalBorrows / updatedBorrowLimitTotal >= 0.95
                  ? 'fail'
                  : 'warn'
                : undefined
            }
          >
            {`${smallUsdFormatter(totalBorrows)} of ${smallUsdFormatter(borrowLimitTotal)}`}
            {' → '}
            {updatedAssets && updatedTotalBorrows !== undefined ? (
              `${smallUsdFormatter(Math.max(updatedTotalBorrows, 0))} of ${smallUsdFormatter(
                updatedBorrowLimitTotal
              )}`
            ) : (
              <Skeleton display="inline">{`${smallUsdFormatter(
                totalBorrows
              )} of ${smallUsdFormatter(borrowLimitTotal)}`}</Skeleton>
            )}
          </Text>
        </Row>

        <Divider />
        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text flexShrink={0} variant="smText">
            Market Supply APY:
          </Text>
          <Text variant={'smText'}>
            {supplyAPY.toFixed(2) + '%'}

            <>
              {' → '}
              {updatedSupplyAPY !== undefined ? (
                updatedSupplyAPY.toFixed(2) + '%'
              ) : (
                <Skeleton display="inline">x.xx</Skeleton>
              )}
            </>
          </Text>
        </Row>

        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text flexShrink={0} variant="smText">
            Market Borrow APR:
          </Text>
          <Text variant={'smText'}>
            {borrowAPR.toFixed(2) + '%'}

            <>
              {' → '}
              {updatedBorrowAPR !== undefined ? (
                updatedBorrowAPR.toFixed(2) + '%'
              ) : (
                <Skeleton display="inline">xx.xxx</Skeleton>
              )}
            </>
          </Text>
        </Row>
      </Column>
    </MidasBox>
  );
};