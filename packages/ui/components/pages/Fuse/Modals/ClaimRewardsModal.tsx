import {
  Box,
  Button,
  Divider,
  HStack,
  Img,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FlywheelClaimableRewards } from '@midas-capital/sdk/dist/cjs/src/modules/Flywheel';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { BigNumber, utils } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BsFillArrowRightCircleFill, BsFillGiftFill } from 'react-icons/bs';
import { useSwitchNetwork } from 'wagmi';

import { Center } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useChainConfig } from '@ui/hooks/useChainConfig';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { useTokenData } from '@ui/hooks/useTokenData';
import { dynamicFormatter } from '@ui/utils/bigUtils';
import { handleGenericError } from '@ui/utils/errorHandling';

const ClaimableToken = ({
  data,
  onClaim,
  claimingRewardTokens,
  rewardChainId,
}: {
  data: FlywheelClaimableRewards;
  onClaim: () => void;
  claimingRewardTokens: string[];
  rewardChainId: string;
}) => {
  const { currentChain } = useMultiMidas();
  const { rewards, rewardToken } = useMemo(() => data, [data]);
  const { data: tokenData } = useTokenData(rewardToken, Number(rewardChainId));
  const { openChainModal } = useChainModal();
  const { switchNetworkAsync } = useSwitchNetwork();
  const chainConfig = useChainConfig(Number(rewardChainId));

  const totalRewardsString = useMemo(
    () =>
      utils.formatUnits(
        rewards.reduce((acc, curr) => (curr ? acc.add(curr.amount) : acc), BigNumber.from(0)),
        tokenData?.decimals
      ),
    [rewards, tokenData?.decimals]
  );

  const handleSwitch = async () => {
    if (chainConfig && switchNetworkAsync) {
      await switchNetworkAsync(chainConfig.chainId);
    } else if (openChainModal) {
      openChainModal();
    }
  };

  return (
    <HStack width="90%" justify="space-between">
      {currentChain && (
        <TokenIcon
          address={rewardToken}
          chainId={Number(rewardChainId)}
          size="xs"
          withMotion={false}
          withTooltip={false}
        />
      )}
      <SimpleTooltip label={totalRewardsString}>
        <Text minWidth="140px" textAlign="end" fontWeight="bold" fontSize={'16'}>
          {dynamicFormatter(Number(totalRewardsString), {
            minimumFractionDigits: 4,
            maximumFractionDigits: 8,
          })}
        </Text>
      </SimpleTooltip>
      <Text minW="80px">{tokenData?.extraData?.shortName ?? tokenData?.symbol}</Text>
      <Box width="150px">
        {currentChain?.id !== Number(rewardChainId) ? (
          <Button
            variant="silver"
            disabled={claimingRewardTokens.length > 0}
            onClick={handleSwitch}
            whiteSpace="normal"
          >
            {chainConfig ? (
              <>
                <Img
                  width={6}
                  height={6}
                  borderRadius="50%"
                  src={chainConfig.specificParams.metadata.img}
                  alt=""
                />
                <Text ml={2} color="raisinBlack">
                  {chainConfig.specificParams.metadata.shortName}
                </Text>
              </>
            ) : (
              <>
                <BsFillArrowRightCircleFill size={24} />
                <Text ml={2} color="raisinBlack">
                  Switch Network
                </Text>
              </>
            )}
          </Button>
        ) : (
          <Button
            disabled={claimingRewardTokens.length > 0}
            onClick={onClaim}
            isLoading={claimingRewardTokens.includes(rewardToken)}
          >
            {chainConfig ? (
              <Img
                width={6}
                height={6}
                borderRadius="50%"
                src={chainConfig.specificParams.metadata.img}
                alt=""
              />
            ) : (
              <BsFillGiftFill size={24} />
            )}
            <Text ml={2} color="raisinBlack">
              Claim
            </Text>
          </Button>
        )}
      </Box>
    </HStack>
  );
};

const ClaimRewardsModal = ({
  isOpen,
  onClose,
  claimableRewards,
}: {
  isOpen: boolean;
  onClose: () => void;
  claimableRewards: { [chainId: string]: FlywheelClaimableRewards[] };
}) => {
  const { currentSdk, address, signer } = useMultiMidas();
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const [claimingRewardTokens, setClaimingRewardTokens] = useState<string[]>([]);
  const [viewedRewards, setViewedRewards] = useState<{
    [chainId: string]: FlywheelClaimableRewards[];
  }>({});

  useEffect(() => {
    setViewedRewards({ ...claimableRewards });
  }, [claimableRewards]);

  // const chainConfig = useChainConfig(Number(currentSdk?.chainId));
  // const claimableRewardsOfCurrentChain = useMemo(() => {
  //   return currentSdk ? claimableRewards[currentSdk.chainId.toString()]?.data : undefined;
  // }, [claimableRewards, currentSdk]);

  const claimRewards = useCallback(
    (rewards: FlywheelClaimableRewards[] | null | undefined) => async () => {
      if (!currentSdk || !address || !signer || !rewards) return;

      try {
        setClaimingRewardTokens(rewards.map((reward) => reward.rewardToken));
        const fwLensRouter = currentSdk.contracts.MidasFlywheelLensRouter;

        for (const reward of rewards) {
          const markets = reward.rewards.map((reward) => reward.market);
          const tx = await fwLensRouter
            .connect(signer)
            .getUnclaimedRewardsByMarkets(address, markets, [reward.flywheel], [true]);

          await tx.wait();
          successToast({
            title: 'Reward claimed!',
          });

          const remains = claimableRewards[currentSdk.chainId.toString()].filter(
            (_reward) => reward.rewardToken !== _reward.rewardToken
          );

          setViewedRewards({ ...claimableRewards, [currentSdk.chainId.toString()]: remains });
        }
      } catch (e) {
        handleGenericError(e, errorToast);
      } finally {
        setClaimingRewardTokens([]);
      }
    },
    [address, currentSdk, signer, errorToast, successToast, claimableRewards]
  );

  return (
    <Modal motionPreset="slideInBottom" isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text variant="title">Claim Rewards</Text>
        </ModalHeader>
        <ModalCloseButton top={4} />
        <Divider />
        <VStack m={4} maxHeight="450px" overflowY="auto">
          {Object.values(viewedRewards).length === 0 || !currentSdk ? (
            <Center>
              <Text fontSize={20} fontWeight="bold">
                No rewards available to be claimed
              </Text>
            </Center>
          ) : (
            <>
              {Object.entries(viewedRewards).map(([key, value]) => {
                return value.map((cr: FlywheelClaimableRewards, index: number) => (
                  <ClaimableToken
                    key={index}
                    rewardChainId={key}
                    data={cr}
                    claimingRewardTokens={claimingRewardTokens}
                    onClaim={claimRewards(key === currentSdk.chainId.toString() ? [cr] : null)}
                  />
                ));
              })}
              {/* <Center pt={4}>
                {claimableRewardsOfCurrentChain && claimableRewardsOfCurrentChain.length > 0 && (
                  <Button
                    width="100%"
                    disabled={claimingRewardTokens.length > 0}
                    onClick={claimRewards(claimableRewardsOfCurrentChain)}
                    isLoading={
                      claimingRewardTokens.length === claimableRewardsOfCurrentChain.length
                    }
                  >
                    {chainConfig ? (
                      <Img
                        width={6}
                        height={6}
                        borderRadius="50%"
                        src={chainConfig.specificParams.metadata.img}
                        alt=""
                      />
                    ) : (
                      <BsFillGiftFill size={24} />
                    )}
                    <Text ml={2} color="raisinBlack">
                      Claim All
                    </Text>
                  </Button>
                )}
              </Center> */}
            </>
          )}
        </VStack>
      </ModalContent>
    </Modal>
  );
};

export default ClaimRewardsModal;
