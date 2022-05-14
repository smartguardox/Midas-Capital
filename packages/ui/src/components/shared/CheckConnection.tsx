import { Text, ToastId, useDisclosure, useToast } from '@chakra-ui/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSigner } from 'wagmi';

import ConnectWalletModal from '@ui/components/shared/ConnectWalletModal';
import LoadingOverlay from '@ui/components/shared/LoadingOverlay';
import SwitchNetworkModal from '@ui/components/shared/SwitchNetworkModal';
import { RariProvider } from '@ui/context/RariContext';

const CheckConnection = ({ children }: { children: ReactNode }) => {
  const { activeChain, chains, isLoading: networkloading } = useNetwork();
  const { data: signerData } = useSigner();
  const { activeConnector, isConnecting, isReconnecting } = useConnect();
  const { data: accountData, isLoading: accountLoading } = useAccount();
  const { disconnect } = useDisconnect();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const routerChainId = router.query.chainId as string;
  const isReady = router.isReady;
  const toastIdRef = useRef<ToastId | undefined>();
  const toast = useToast();

  useEffect(() => {
    if ((!isConnecting && !isReconnecting && !activeConnector) || activeChain?.unsupported) {
      onOpen();
    }
  }, [activeConnector, onOpen, isConnecting, isReconnecting, activeChain?.unsupported]);

  useEffect(() => {
    if (activeChain?.unsupported) {
      if (!toastIdRef.current) {
        toastIdRef.current = toast({
          title: `Unsupported Network(${activeChain.name}) Detected!`,
          description: (
            <>
              <Text>{`Supported Networks: ${chains.map((chain) => chain.name).join(', ')}`}</Text>
            </>
          ),
          status: 'warning',
          position: 'bottom-right',
          duration: null,
          isClosable: true,
        });
      }
    } else {
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
        toastIdRef.current = undefined;
      }
    }
  }, [activeChain, chains, toast]);

  useEffect(() => {
    if (isReady && activeChain?.id && routerChainId !== activeChain.id.toString()) {
      const chainId = activeChain.id.toString();

      router.push(
        {
          pathname: `/[chainId]`,
          query: { chainId, sortBy: 'supply' },
        },
        undefined,
        { shallow: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChain?.id, isReady, routerChainId]);

  useEffect(() => {
    if (!isConnecting && !isReconnecting && !activeConnector) {
      router.push('/', undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnector, isConnecting, isReconnecting]);

  return (
    <>
      <Head>
        <title>Midas Capital</title>
      </Head>
      {isConnecting || isReconnecting ? (
        <LoadingOverlay isLoading={true} />
      ) : !activeConnector ? (
        <ConnectWalletModal isOpen={isOpen} onClose={onClose} />
      ) : networkloading ? (
        <LoadingOverlay isLoading={true} />
      ) : !activeChain || activeChain.unsupported ? (
        <SwitchNetworkModal isOpen={isOpen} onClose={onClose} />
      ) : !signerData?.provider ? (
        <LoadingOverlay isLoading={true} />
      ) : accountLoading || !accountData?.address ? (
        <LoadingOverlay isLoading={true} />
      ) : (
        <RariProvider
          currentChain={activeChain}
          chains={chains}
          signerProvider={signerData.provider}
          address={accountData.address}
          disconnect={disconnect}
        >
          {children}
        </RariProvider>
      )}
    </>
  );
};

export default CheckConnection;
