import type { GetServerSideProps, NextPage } from 'next';
import * as React from 'react';
import Layout from '~/components/Layout';
import { InputAmount, InputText, SubmitButton } from '~/components/Form';
import { BeatLoader } from 'react-spinners';
import useCreateScheduledTransferContract from '~/queries/useCreateScheduledTransfer';
import { TransactionDialog } from '~/components/Dialog';
import { useDialogState } from 'ariakit';
import { StreamIcon } from '~/components/Icons';
import { useNetworkProvider } from '~/hooks';
import { networkDetails } from '~/lib/networkDetails';
import { useTokenPrice } from '~/queries/useTokenPrice';
import { useAccount, useNetwork } from 'wagmi';
import { getFormattedMaxPrice } from '~/components/ScheduledTransfers/utils';
import { WalletSelector } from '~/components/Web3';

interface IFormElements {
  oracleAddress: { value: string };
  tokenAddress: { value: string };
  maxPrice: { value: string };
}

const Home: NextPage = () => {
  const [{ data: accountData }] = useAccount();
  const [{ data: networkData }] = useNetwork();

  const [tokenAddress, setTokenAddress] = React.useState('');

  const txHash = React.useRef('');

  const txDialogState = useDialogState();

  const walletDialog = useDialogState();

  const { chainId } = useNetworkProvider();

  const factoryAddress = chainId ? networkDetails[chainId].scheduledTransferFactory : null;

  const { mutateAsync, isLoading } = useCreateScheduledTransferContract({ factoryAddress });

  const { data: tokenPrice } = useTokenPrice(tokenAddress);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement & IFormElements;

    const oracleAddress = form.oracleAddress?.value;
    const tokenAddress = form.tokenAddress?.value;
    const minPriceUSD = form.minPriceUSD?.value;

    const formattedPrice = getFormattedMaxPrice(minPriceUSD, tokenPrice?.decimals);

    mutateAsync(
      { oracleAddress, tokenAddress, maxPrice: formattedPrice },
      {
        onSuccess: (data) => {
          txHash.current = data.hash;
          txDialogState.toggle();
          form.reset();
        },
      }
    );
  };

  return (
    <Layout className="flex flex-col gap-12">
      <form className="mx-auto flex w-full max-w-lg flex-col gap-4" onSubmit={handleSubmit}>
        <h1 className="font-exo mx-auto mb-5 flex items-center gap-[0.625rem] text-2xl font-semibold text-lp-gray-4 dark:text-white">
          <StreamIcon />
          <span>Create Scheduled Transfers Contract</span>
        </h1>

        <InputText name="oracleAddress" isRequired label="Oracle Address" placeholder="0x..." />

        <InputText
          name="tokenAddress"
          isRequired
          label="Token Address"
          placeholder="0x..."
          handleChange={(e) => setTokenAddress(e.target.value)}
        />

        <InputAmount name="minPriceUSD" isRequired label="Min Price (USD)" placeholder="1000" />
        <small className="-mt-2 flex min-h-[1.5rem] flex-col">
          {tokenPrice && tokenAddress.length === 42 ? (
            <span className="rounded bg-[#E7E7E7]/40 px-2 py-1 text-xs text-[#4E575F] dark:bg-[#222222] dark:text-white">
              {`1 ${tokenPrice.symbol} = $${tokenPrice.price.toLocaleString()}`}
            </span>
          ) : (
            ''
          )}
        </small>

        {!accountData ? (
          <SubmitButton type="button" className="mt-2" onClick={walletDialog.toggle}>
            Connect Wallet
          </SubmitButton>
        ) : (
          <SubmitButton
            disabled={
              !factoryAddress ||
              isLoading ||
              tokenAddress.length !== 42 ||
              (networkData?.chain?.testnet ? false : !tokenPrice)
            }
            className="mt-2"
          >
            {!factoryAddress ? 'Chain not supported' : isLoading ? <BeatLoader size={6} color="white" /> : 'Create'}
          </SubmitButton>
        )}
      </form>

      <TransactionDialog dialog={txDialogState} transactionHash={txHash.current || ''} />

      <WalletSelector dialog={walletDialog} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  // Pass data to the page via props
  return {
    props: {
      messages: (await import(`translations/${locale}.json`)).default,
    },
  };
};

export default Home;
